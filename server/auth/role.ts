import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { prisma } from '../db/client'
import { UserRole } from '@prisma/client'

// ============================================================================
// RBAC Error Codes (for consistent API error handling)
// ============================================================================
export const AUTH_ERRORS = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  FORBIDDEN_ROLE: 'FORBIDDEN_ROLE',
  FORBIDDEN_OWNER: 'FORBIDDEN_OWNER',
  FORBIDDEN_SELF_APPLICATION: 'FORBIDDEN_SELF_APPLICATION',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',  // For duplicate entries, already applied, etc.
} as const

export type AuthError = (typeof AUTH_ERRORS)[keyof typeof AUTH_ERRORS]

/**
 * Custom error class for auth-related errors
 */
export class AuthorizationError extends Error {
  code: AuthError
  
  constructor(code: AuthError, message?: string) {
    super(message || code)
    this.code = code
    this.name = 'AuthorizationError'
  }
}

// ============================================================================
// Core Auth Helpers
// ============================================================================

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
 * Require the user to be authenticated, throw error if not
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthorizationError(AUTH_ERRORS.UNAUTHENTICATED, 'Authentication required')
  }
  return user
}

/**
 * Require the user to have a specific role, throw error if not
 * @param role - Single role or array of allowed roles
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  
  if (!roles.includes(user.role)) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN_ROLE,
      `Access denied: requires one of [${roles.join(', ')}] role`
    )
  }
  return user
}

/**
 * Require the user to have any of the provided roles
 * @deprecated Use requireRole with array instead
 */
export async function requireAnyRole(roles: UserRole[]) {
  return requireRole(roles)
}

// ============================================================================
// Ownership Helpers
// ============================================================================

/**
 * Assert that the current user owns a resource
 * @throws AuthorizationError if user is not the owner
 */
export function assertOwner(userId: string, ownerId: string) {
  if (userId !== ownerId) {
    throw new AuthorizationError(
      AUTH_ERRORS.FORBIDDEN_OWNER,
      'You do not have permission to access this resource'
    )
  }
}

/**
 * Check if user is the owner (non-throwing version)
 */
export function isOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId
}

// ============================================================================
// API Error Handling Helper
// ============================================================================

/**
 * Map auth errors to HTTP status codes
 */
export function getHttpStatusForAuthError(error: unknown): number {
  if (error instanceof AuthorizationError) {
    switch (error.code) {
      case AUTH_ERRORS.UNAUTHENTICATED:
        return 401
      case AUTH_ERRORS.INVALID_INPUT:
        return 400
      case AUTH_ERRORS.NOT_FOUND:
        return 404
      case AUTH_ERRORS.CONFLICT:
        return 409
      case AUTH_ERRORS.FORBIDDEN:
      case AUTH_ERRORS.FORBIDDEN_ROLE:
      case AUTH_ERRORS.FORBIDDEN_OWNER:
      case AUTH_ERRORS.FORBIDDEN_SELF_APPLICATION:
        return 403
      default:
        return 403
    }
  }
  // Check for legacy error messages
  if (error instanceof Error) {
    if (error.message.includes('Authentication required') || 
        error.message.includes('UNAUTHENTICATED')) {
      return 401
    }
    if (error.message.toLowerCase().includes('not found')) {
      return 404
    }
    if (error.message.includes('Access denied') || 
        error.message.includes('FORBIDDEN') ||
        error.message.includes('not allowed') ||
        error.message.includes('not authorized')) {
      return 403
    }
    if (error.message.includes('already') || error.message.includes('duplicate')) {
      return 409
    }
  }
  return 500
}

/**
 * Check if an error is an auth-related error (or structured API error)
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthorizationError) return true
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('unauthenticated') ||
           msg.includes('unauthorized') ||
           msg.includes('forbidden') ||
           msg.includes('access denied') ||
           msg.includes('not allowed') ||
           msg.includes('not authorized') ||
           msg.includes('authentication required') ||
           msg.includes('not found') ||
           msg.includes('already')
  }
  return false
}

/**
 * Check if an error is specifically a NOT_FOUND error
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof AuthorizationError && error.code === AUTH_ERRORS.NOT_FOUND) {
    return true
  }
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('not found')
  }
  return false
}

