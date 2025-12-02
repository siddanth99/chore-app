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
      },
      async authorize(credentials) {
        try {
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
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
