import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../db/client'
import { compare } from 'bcryptjs'
import { UserRole } from '@prisma/client'

// Validate required environment variables at startup
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('[NextAuth] Warning: NEXTAUTH_SECRET is not set. Authentication will fail.')
}

// Create custom adapter that maps Google's `image` field to Prisma's `avatarUrl`
const baseAdapter = PrismaAdapter(prisma) as any
const customAdapter = {
  ...baseAdapter,
  async createUser(data: { name?: string | null; email?: string | null; emailVerified?: Date | null; image?: string | null; [key: string]: any }) {
    // Extract `image` and `emailVerified` fields
    // Exclude both from the data passed to Prisma
    // - `image` is mapped to `avatarUrl` (Prisma doesn't have `image`)
    // - `emailVerified` is not stored in our schema, so we drop it
    const { image, emailVerified, ...restData } = data
    
    // Create user with mapped fields
    // Note: name and email are required by Prisma schema, so they should be present from OAuth
    // hashedPassword is optional (String?) so we omit it for OAuth users
    return prisma.user.create({
      data: {
        name: restData.name ?? '',
        email: restData.email ?? '',
        avatarUrl: image ?? null, // Map Google profile picture to avatarUrl
        // Default role to CUSTOMER for OAuth users (same as email signup)
        role: 'CUSTOMER',
        // hashedPassword is optional, omit it for OAuth users
        // emailVerified is not stored in our schema, so we don't pass it
      } as any, // Type assertion to handle Prisma's complex input types
    })
  },
}

export const authOptions: NextAuthOptions = {
  // Note: When using CredentialsProvider with JWT strategy, the adapter is only used
  // for account linking, not session management. This is the recommended pattern.
  adapter: customAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      // When session is updated (via update()), fetch fresh role from DB
      if (trigger === 'update' && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        if (freshUser) {
          token.role = freshUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // Always use the token role (which is refreshed on update)
        session.user.role = token.role as UserRole
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful sign-in
      // This applies to Google OAuth, email/password, and any other provider
      return `${baseUrl}/dashboard`
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
