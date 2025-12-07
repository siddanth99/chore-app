/**
 * Rate Limiting Utilities
 * 
 * Uses Upstash Rate Limit for distributed rate limiting.
 * Falls back to a simple in-memory limiter when Upstash is not configured.
 * 
 * Environment variables required for Upstash:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 * 
 * Usage:
 * ```ts
 * const { success, remaining, reset } = await choreCreationLimiter.limit(key)
 * if (!success) {
 *   return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Check if Upstash is configured
 */
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
)

/**
 * Redis instance (only created if Upstash is configured)
 */
const redis = isUpstashConfigured ? Redis.fromEnv() : null

// ============================================================================
// In-Memory Fallback (for development without Upstash)
// ============================================================================

interface InMemoryEntry {
  count: number
  windowStart: number
}

const inMemoryStore = new Map<string, InMemoryEntry>()

/**
 * Simple in-memory rate limiter for development
 * NOT suitable for production with multiple server instances
 */
function createInMemoryLimiter(maxRequests: number, windowMs: number) {
  return {
    async limit(key: string): Promise<{ success: boolean; remaining: number; reset: number }> {
      const now = Date.now()
      const windowStart = Math.floor(now / windowMs) * windowMs
      const fullKey = `${key}:${windowStart}`
      
      // Clean up old entries periodically (every 100 calls)
      if (Math.random() < 0.01) {
        const cutoff = now - windowMs * 2
        for (const [k, v] of inMemoryStore) {
          if (v.windowStart < cutoff) {
            inMemoryStore.delete(k)
          }
        }
      }
      
      const entry = inMemoryStore.get(fullKey)
      const currentCount = entry?.count ?? 0
      
      if (currentCount >= maxRequests) {
        return {
          success: false,
          remaining: 0,
          reset: windowStart + windowMs,
        }
      }
      
      inMemoryStore.set(fullKey, { count: currentCount + 1, windowStart })
      
      return {
        success: true,
        remaining: maxRequests - currentCount - 1,
        reset: windowStart + windowMs,
      }
    },
  }
}

// ============================================================================
// Rate Limiters
// ============================================================================

/**
 * Create a rate limiter (Upstash or in-memory fallback)
 */
function createLimiter(
  maxRequests: number,
  window: string,
  prefix: string
) {
  if (redis) {
    // Use Upstash rate limiter
    return new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(maxRequests, window as any),
      analytics: true,
      prefix: `rl_${prefix}`,
    })
  }
  
  // Fallback to in-memory limiter
  // Parse window string (e.g., "1 h" -> 3600000ms, "24 h" -> 86400000ms)
  const windowMs = parseWindowToMs(window)
  console.warn(
    `[Rate Limit] Upstash not configured. Using in-memory limiter for "${prefix}". ` +
    'This is NOT suitable for production with multiple server instances.'
  )
  return createInMemoryLimiter(maxRequests, windowMs)
}

/**
 * Parse window string to milliseconds
 */
function parseWindowToMs(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/)
  if (!match) {
    throw new Error(`Invalid window format: ${window}`)
  }
  
  const value = parseInt(match[1], 10)
  const unit = match[2]
  
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    case 'd': return value * 24 * 60 * 60 * 1000
    default: return value * 1000
  }
}

// ============================================================================
// Exported Rate Limiters
// ============================================================================

/**
 * Chore creation: 5 per hour per user
 * Prevents spam chore creation
 */
export const choreCreationLimiter = createLimiter(5, '1 h', 'chore_create')

/**
 * Application submission: 10 per hour per user
 * Prevents spam applications to chores
 */
export const applicationCreationLimiter = createLimiter(10, '1 h', 'application_create')

/**
 * Profile updates: 20 per day per user
 * Prevents excessive profile changes
 */
export const profileUpdateLimiter = createLimiter(20, '24 h', 'profile_update')

/**
 * Message sending: 30 per hour per user
 * Prevents chat spam
 */
export const messageSendLimiter = createLimiter(30, '1 h', 'message_send')

/**
 * File uploads: 10 per hour per user
 * Prevents storage abuse
 */
export const fileUploadLimiter = createLimiter(10, '1 h', 'file_upload')

/**
 * OTP request: 5 per hour per phone
 * Prevents SMS spam and abuse
 */
export const otpRequestLimiter = createLimiter(5, '1 h', 'otp_request')

/**
 * OTP verification: 20 per hour per phone
 * Allows multiple attempts but prevents brute force
 */
export const otpVerifyLimiter = createLimiter(20, '1 h', 'otp_verify')

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get rate limit key from request
 * Uses user ID when authenticated, falls back to IP address
 * 
 * @param req - The request object
 * @param userId - Optional user ID (from session)
 * @returns Rate limit key string
 */
export function getRateLimitKey(req: Request, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Fallback to IP if no user
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  
  const ip = forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'unknown'
  return `ip:${ip}`
}

/**
 * Standard rate limit response for 429 errors
 */
export interface RateLimitResponse {
  error: string
  retryAfter: number
}

/**
 * Create a standard rate limit error response
 */
export function createRateLimitResponse(
  reset: number,
  customMessage?: string
): RateLimitResponse {
  return {
    error: customMessage ?? 'Rate limit exceeded. Please try again later.',
    retryAfter: reset,
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type RateLimitResult = {
  success: boolean
  remaining: number
  reset: number
}

