import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { requestOtpSchema } from '@/lib/validation/otp.schema'
import { generateOtp, hashOtp, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/otp'
import { otpRequestLimiter, getRateLimitKey } from '@/lib/rate-limit'

/**
 * Helper: fetch with timeout to prevent hanging on slow providers
 * @param url - URL to fetch
 * @param opts - Fetch options
 * @param timeout - Timeout in milliseconds (default: 6000ms)
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
 * POST /api/auth/request-otp
 * 
 * Request an OTP to be sent to a phone number via SMS.
 * 
 * Body: { phone: string } (E.164 format recommended, e.g., +919876543210)
 * 
 * Returns: { ok: true, expiresAt: ISO string, resendCooldownSeconds: number }
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
    const parsed = requestOtpSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { phone } = parsed.data

    // Generate OTP
    const otp = generateOtp()
    const otpHash = await hashOtp(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Upsert verification record
    await prisma.phoneVerification.upsert({
      where: { phone },
      create: { phone, otpHash, expiresAt },
      update: { otpHash, expiresAt, verified: false, attempts: 0 },
    })

    const endpoint = process.env.PABBLY_SMS_ENDPOINT
    const respMetadata: any = { sent: false, providerResp: null, sentAt: new Date() }

    if (endpoint) {
      // Pabbly Connect webhook - send JSON { to, message }
      // NOTE: Pabbly Connect webhooks don't require API keys.
      // If your webhook expects different field names (e.g., "phone" instead of "to"),
      // update the payload below to match your Pabbly flow configuration.
      const payload = {
        to: phone,
        message: `Your verification code for ${process.env.NEXT_PUBLIC_APP_NAME ?? 'ChoreApp'} is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        // Add any other fields your Pabbly Connect webhook expects:
        // senderId: process.env.PABBLY_SENDER_ID,
        // templateId: process.env.PABBLY_TEMPLATE_ID,
        // etc.
      }

      try {
        const providerRes = await fetchWithTimeout(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          6000 // 6 second timeout
        )
        const text = await providerRes.text().catch(() => '')
        respMetadata.sent = providerRes.ok
        respMetadata.providerResp = text
      } catch (err: any) {
        respMetadata.sent = false
        respMetadata.providerErr = err?.message ?? String(err)
        // Don't throw - persist metadata below
      }

      // Persist provider metadata
      await prisma.phoneVerification.updateMany({
        where: { phone },
        data: { metadata: respMetadata },
      })
    } else {
      // Dev fallback: only print OTP in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${phone}: ${otp}`)
        respMetadata.sent = false
        respMetadata.devPrinted = true
        await prisma.phoneVerification.updateMany({
          where: { phone },
          data: { metadata: respMetadata },
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
    console.error('[OTP] Request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
