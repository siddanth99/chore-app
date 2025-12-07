import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Validate required environment variables at startup
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('[NextAuth] Warning: NEXTAUTH_SECRET is not set. Authentication will fail.')
}

export const authOptions: NextAuthOptions = {
  // Note: When using CredentialsProvider with JWT strategy, the adapter is only used
  // for account linking, not session management. This is the recommended pattern.
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          // Handle phone + OTP authentication
          if (credentials?.phone && credentials?.otp) {
            const phoneVerification = await prisma.phoneVerification.findUnique({
              where: { phone: credentials.phone },
            })

            if (!phoneVerification || !phoneVerification.verified) {
              console.log('[NextAuth] Phone OTP not verified:', credentials.phone)
              return null
            }

            // Verify OTP is still valid (check expiry)
            if (phoneVerification.expiresAt < new Date()) {
              console.log('[NextAuth] Phone OTP expired:', credentials.phone)
              return null
            }

            // Find user by phone
            const user = await prisma.user.findFirst({
              where: { phone: credentials.phone },
            })

            if (!user) {
              console.log('[NextAuth] User not found for phone:', credentials.phone)
              return null
            }

            // Verify OTP hash
            const { verifyOtpHash } = await import('@/lib/otp')
            const isValid = await verifyOtpHash(phoneVerification.otpHash, credentials.otp)

            if (!isValid) {
              console.log('[NextAuth] Invalid OTP for phone:', credentials.phone)
              return null
            }

            console.log('[NextAuth] Successful phone OTP login for:', credentials.phone)
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          }

          // Handle email + password authentication (existing flow)
          if (!credentials?.email || !credentials?.password) {
            console.log('[NextAuth] Missing credentials')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.hashedPassword) {
            console.log('[NextAuth] User not found or no password:', credentials.email)
            return null
          }

          const isValid = await compare(credentials.password, user.hashedPassword)

          if (!isValid) {
            console.log('[NextAuth] Invalid password for:', credentials.email)
            return null
          }

          console.log('[NextAuth] Successful login for:', credentials.email)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.error('[NextAuth] Error in authorize:', error)
          // Return null instead of throwing to prevent 500 errors
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
