import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

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

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    })

    // Always respond 200 to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        {
          message:
            'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      )
    }

    // Check if user has a password (not OAuth-only)
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hashedPassword: true },
    })

    if (!userWithPassword?.hashedPassword) {
      return NextResponse.json(
        {
          message:
            'If an account exists with this email, you will receive a password reset link.',
        },
        { status: 200 }
      )
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')

    // Expiration (1 hour)
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    // Remove existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    })

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expires,
      },
    })

    // Determine base URL
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'

    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const resend = new Resend(process.env.RESEND_API_KEY!)

await resend.emails.send({
  from: "Chore App <onboarding@resend.dev>", // TEMP sender
  to: user.email,
  subject: "Reset your password",
  html: `<p>Reset link: <a href="${resetUrl}">${resetUrl}</a></p>`,
})

    // ---- SEND EMAIL USING RESEND ----
    try {
      const resend = new Resend(process.env.RESEND_API_KEY!)

      await resend.emails.send({
        from: 'Chore App <no-reply@choreapp.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `
          <p>Hello${user.name ? ` ${user.name}` : ''},</p>

          <p>You recently requested to reset your password for your Chore App account.</p>

          <p>Click the link below to reset it (expires in 1 hour):</p>

          <p><a href="${resetUrl}" target="_blank" style="font-size:16px;color:#2563eb;">
            Reset Password
          </a></p>

          <p>If you did not request this, you can safely ignore this email.</p>

          <p>– Chore App Team</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send password reset email via Resend:', emailError)
      // We still return success to avoid exposing system info
    }

    return NextResponse.json(
      {
        message:
          'If an account exists with this email, you will receive a password reset link.',
      },
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