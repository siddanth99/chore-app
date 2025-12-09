import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { verifyOtpSchema } from '@/lib/validation/otp.schema'
import { verifyOtpHash, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { otpVerifyLimiter, getRateLimitKey } from '@/lib/rate-limit'

/**
 * POST /api/auth/verify-otp
 * 
 * Verify an OTP for a phone number.
 * 
 * Body: { phone: string, otp: string }
 * 
 * Returns: { verified: true } on success
 * 
 * Rate limited: 20 requests per hour per phone
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, null)
    const rateLimitResult = await otpVerifyLimiter.limit(rateLimitKey)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many verification attempts. Please try again later.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const parseResult = verifyOtpSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          issues: parseResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { phone, otp } = parseResult.data

    // Find phone verification record
    const phoneVerification = await prisma.phoneVerification.findUnique({
      where: { phone },
    })

    if (!phoneVerification) {
      return NextResponse.json(
        { error: 'No OTP requested for this phone number. Please request an OTP first.' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (phoneVerification.verified) {
      return NextResponse.json(
        { verified: true },
        { status: 200 }
      )
    }

    // Check if OTP expired
    if (phoneVerification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 410 } // 410 Gone - resource expired
      )
    }

    // Check if max attempts reached
    if (phoneVerification.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { 
          error: 'Maximum verification attempts reached. Please request a new OTP.',
          maxAttemptsReached: true,
        },
        { status: 429 }
      )
    }

    // Verify OTP hash
    const isValid = await verifyOtpHash(phoneVerification.otpHash, otp)

    if (!isValid) {
      // Increment attempts
      await prisma.phoneVerification.update({
        where: { phone },
        data: {
          attempts: {
            increment: 1,
          },
          metadata: {
            ...(phoneVerification.metadata as any || {}),
            lastAttemptAt: new Date().toISOString(),
            attempts: phoneVerification.attempts + 1,
          },
        },
      })

      const remainingAttempts = OTP_MAX_ATTEMPTS - (phoneVerification.attempts + 1)
      
      return NextResponse.json(
        { 
          error: 'Invalid OTP',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
        },
        { status: 401 }
      )
    }

    // OTP is valid - mark as verified
    await prisma.phoneVerification.update({
      where: { phone },
      data: {
        verified: true,
        attempts: 0, // Reset attempts on success
        metadata: {
          ...(phoneVerification.metadata as any || {}),
          verifiedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(
      { verified: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('[OTP] Verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


