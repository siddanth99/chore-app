import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { prisma } from '../db/client'
import { UserRole } from '@prisma/client'

/**
 * Get the current authenticated user from the session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return user
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

/**
 * Check if the current user has any of the provided roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser()
  return user ? roles.includes(user.role) : false
}

/**
 * Require the user to have a specific role, throw error if not
 */
export async function requireRole(role: UserRole) {
  const user = await getCurrentUser()
  if (!user || user.role !== role) {
    throw new Error(`Access denied: requires ${role} role`)
  }
  return user
}

/**
 * Require the user to be authenticated, throw error if not
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

