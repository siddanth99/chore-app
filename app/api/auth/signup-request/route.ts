import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { signupRequestSchema } from '@/lib/validation/otp.schema'
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/otp'
import { otpRequestLimiter, getRateLimitKey } from '@/lib/rate-limit'
import { hash } from 'bcryptjs'
import { $Enums } from '@prisma/client'

type UserRole = $Enums.UserRole

/**
 * Helper: fetch with timeout to prevent hanging on slow providers
 */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 6000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

/**
 * POST /api/auth/signup-request
 * 
 * Request signup with optional phone verification.
 * 
 * Body: { name, email, password, phone?, role? }
 * 
 * If phone is provided:
 *   - Creates SignupTemp record with hashed password
 *   - Generates OTP and sends via Pabbly
 *   - Returns { ok: true, tempId, expiresAt, resendCooldownSeconds }
 * 
 * If phone is NOT provided:
 *   - Creates user immediately
 *   - Returns { ok: true, created: true, userId }
 * 
 * Rate limited: 5 requests per hour per phone (if phone provided)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = signupRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, email, password, phone, role } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Role defaults to CUSTOMER if not provided or invalid
    const userRole = role && (role === 'CUSTOMER' || role === 'WORKER') 
      ? (role as UserRole)
      : 'CUSTOMER'

    // If no phone provided, create user immediately
    if (!phone) {
      const hashedPassword = await hash(password, 10)
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          hashedPassword,
          phone: null,
          role: userRole,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return NextResponse.json(
        { 
          ok: true, 
          created: true, 
          userId: user.id 
        },
        { status: 201 }
      )
    }

    // Phone provided - require OTP verification
    // Rate limiting for OTP request
    const rateLimitKey = getRateLimitKey(req, null)
    const rateLimitResult = await otpRequestLimiter.limit(rateLimitKey)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Check if SignupTemp already exists for this email
    const existingTemp = await prisma.signupTemp.findUnique({
      where: { email },
    })

    if (existingTemp) {
      // Delete old temp record to allow new signup attempt
      await prisma.signupTemp.delete({
        where: { email },
      })
    }

    // Hash password for SignupTemp
    const passwordHash = await hash(password, 10)

    // Create SignupTemp record
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    const signupTemp = await prisma.signupTemp.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        expiresAt,
        metadata: {
          role: userRole,
        },
      },
    })

    // Generate OTP
    const otp = generateOtp()
    const otpHash = await hashOtp(otp)
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Upsert phone verification record, link to SignupTemp via metadata
    await prisma.phoneVerification.upsert({
      where: { phone },
      create: {
        phone,
        otpHash,
        expiresAt: otpExpiresAt,
        metadata: {
          signupTempId: signupTemp.id,
        },
      },
      update: {
        otpHash,
        expiresAt: otpExpiresAt,
        verified: false,
        attempts: 0,
        metadata: {
          signupTempId: signupTemp.id,
        },
      },
    })

    // Send OTP via Pabbly
    const endpoint = process.env.PABBLY_SMS_ENDPOINT
    const respMetadata: any = { sent: false, providerResp: null, sentAt: new Date() }

    if (endpoint) {
      // Pabbly Connect webhook - send JSON { to, message }
      // NOTE: Update payload fields if your Pabbly Connect webhook expects different field names
      const payload = {
        to: phone,
        message: `Your verification code for ${process.env.NEXT_PUBLIC_APP_NAME ?? 'ChoreApp'} is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      }

      try {
        const providerRes = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          6000
        )
        const text = await providerRes.text().catch(() => '')
        respMetadata.sent = providerRes.ok
        respMetadata.providerResp = text
      } catch (err: any) {
        respMetadata.sent = false
        respMetadata.providerErr = err?.message ?? String(err)
      }

      // Update phone verification metadata with provider response
      await prisma.phoneVerification.updateMany({
        where: { phone },
        data: { metadata: { ...respMetadata, signupTempId: signupTemp.id } },
      })
    } else {
      // Dev fallback: only print OTP in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${phone}: ${otp}`)
        respMetadata.sent = false
        respMetadata.devPrinted = true
        await prisma.phoneVerification.updateMany({
          where: { phone },
          data: { metadata: { ...respMetadata, signupTempId: signupTemp.id } },
        })
      } else {
        // Production but no provider configured
        return NextResponse.json(
          { error: 'SMS provider not configured' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      ok: true,
      tempId: signupTemp.id,
      expiresAt: otpExpiresAt.toISOString(),
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    })
  } catch (error) {
    console.error('[Signup Request] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

