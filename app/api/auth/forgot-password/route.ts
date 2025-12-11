import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { sendExternalNotification } from '@/server/notifications/external'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists and has a password (not OAuth-only)
    if (!user) {
      // Return success but don't send email
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      )
    }

    // Check if user has a password (not OAuth-only)
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hashedPassword: true },
    })

    if (!userWithPassword?.hashedPassword) {
      // User signed up with OAuth only, can't reset password
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link.' },
        { status: 200 }
      )
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    
    // Set expiration to 1 hour from now
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      },
    })

    // Generate reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Send email via Pabbly webhook (or Resend/Nodemailer if configured)
    // For now, we'll use the existing notification system
    try {
      await sendExternalNotification({
        userId: user.id,
        email: user.email,
        channel: 'email',
        event: 'password.reset',
        title: 'Reset your password',
        message: `Click the link below to reset your password. This link will expire in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`,
        link: resetUrl,
        meta: { token, expires: expires.toISOString() },
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success to user, but log the error
    }

    return NextResponse.json(
      { message: 'If an account exists with this email, you will receive a password reset link.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

