import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { signinRequestSchema } from '@/lib/validation/otp.schema'
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/otp'
import { otpRequestLimiter, getRateLimitKey } from '@/lib/rate-limit'

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
 * POST /api/auth/signin-request
 * 
 * Request OTP for phone-based sign-in.
 * 
 * Body: { phone: string }
 * 
 * Returns: { ok: true, expiresAt, resendCooldownSeconds }
 * 
 * Rate limited: 5 requests per hour per phone
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, null)
    const rateLimitResult = await otpRequestLimiter.limit(rateLimitKey)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await req.json().catch(() => null)
    const parsed = signinRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { phone } = parsed.data

    // Check if user exists with this phone
    const user = await prisma.user.findFirst({
      where: { phone },
    })

    if (!user) {
      // Don't reveal if phone exists or not (security)
      // Still generate OTP but don't send (or send generic message)
      // For better UX, you might want to return a generic error
      return NextResponse.json(
        { error: 'If this phone number is registered, an OTP will be sent.' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOtp()
    const otpHash = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Upsert phone verification record, link to user via metadata
    await prisma.phoneVerification.upsert({
      where: { phone },
      create: {
        phone,
        otpHash,
        expiresAt,
        metadata: {
          userId: user.id,
          purpose: 'signin',
        },
      },
      update: {
        otpHash,
        expiresAt,
        verified: false,
        attempts: 0,
        metadata: {
          userId: user.id,
          purpose: 'signin',
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
        message: `Your sign-in code for ${process.env.NEXT_PUBLIC_APP_NAME ?? 'ChoreApp'} is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
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
        data: { metadata: { ...respMetadata, userId: user.id, purpose: 'signin' } },
      })
    } else {
      // Dev fallback: only print OTP in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Sign-in OTP for ${phone}: ${otp}`)
        respMetadata.sent = false
        respMetadata.devPrinted = true
        await prisma.phoneVerification.updateMany({
          where: { phone },
          data: { metadata: { ...respMetadata, userId: user.id, purpose: 'signin' } },
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
      expiresAt: expiresAt.toISOString(),
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    })
  } catch (error) {
    console.error('[Signin Request] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

