import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { signupVerifySchema } from '@/lib/validation/otp.schema'
import { verifyOtpHash, OTP_MAX_ATTEMPTS } from '@/lib/otp'
import { otpVerifyLimiter, getRateLimitKey } from '@/lib/rate-limit'

/**
 * POST /api/auth/signup-verify
 * 
 * Verify OTP and finalize signup by creating User from SignupTemp.
 * 
 * Body: { tempId, phone, otp }
 * 
 * Returns: { ok: true, userId } on success
 * 
 * Rate limited: 20 attempts per hour per phone
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req, null)
    const rateLimitResult = await otpVerifyLimiter.limit(rateLimitKey)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await req.json().catch(() => null)
    const parsed = signupVerifySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { tempId, phone, otp } = parsed.data

    // Find SignupTemp record
    const signupTemp = await prisma.signupTemp.findUnique({
      where: { id: tempId },
    })

    if (!signupTemp) {
      return NextResponse.json(
        { error: 'Invalid or expired signup request' },
        { status: 404 }
      )
    }

    // Verify phone matches
    if (signupTemp.phone !== phone) {
      return NextResponse.json(
        { error: 'Phone number does not match signup request' },
        { status: 400 }
      )
    }

    // Check if SignupTemp expired
    if (signupTemp.expiresAt && signupTemp.expiresAt < new Date()) {
      // Clean up expired temp
      await prisma.signupTemp.delete({ where: { id: tempId } })
      return NextResponse.json(
        { error: 'Signup request has expired. Please start again.' },
        { status: 410 }
      )
    }

    // Find phone verification record
    const phoneVerification = await prisma.phoneVerification.findUnique({
      where: { phone },
    })

    if (!phoneVerification) {
      return NextResponse.json(
        { error: 'No OTP requested for this phone number' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (phoneVerification.verified) {
      // User might have already verified - check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: signupTemp.email },
      })
      if (existingUser) {
        return NextResponse.json(
          { ok: true, userId: existingUser.id, alreadyCreated: true },
          { status: 200 }
        )
      }
    }

    // Check if OTP expired
    if (phoneVerification.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new OTP.' },
        { status: 410 }
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

    // OTP is valid - create user from SignupTemp
    // Get role from metadata or default to CUSTOMER
    const metadata = signupTemp.metadata as any
    const userRole = metadata?.role || 'CUSTOMER'

    // Check if user was created in the meantime (race condition)
    const existingUser = await prisma.user.findUnique({
      where: { email: signupTemp.email },
    })

    if (existingUser) {
      // User already exists - clean up temp and mark phone as verified
      await prisma.signupTemp.delete({ where: { id: tempId } })
      await prisma.phoneVerification.update({
        where: { phone },
        data: { verified: true },
      })
      return NextResponse.json(
        { ok: true, userId: existingUser.id, alreadyCreated: true },
        { status: 200 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name: signupTemp.name,
        email: signupTemp.email,
        hashedPassword: signupTemp.passwordHash,
        phone: signupTemp.phone,
        role: userRole as any,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    })

    // Mark phone as verified
    await prisma.phoneVerification.update({
      where: { phone },
      data: {
        verified: true,
        attempts: 0,
        metadata: {
          ...(phoneVerification.metadata as any || {}),
          verifiedAt: new Date().toISOString(),
          userId: user.id,
        },
      },
    })

    // Delete SignupTemp record
    await prisma.signupTemp.delete({
      where: { id: tempId },
    })

    return NextResponse.json(
      { ok: true, userId: user.id, email: user.email },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Signup Verify] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

