import { NextResponse } from 'next/server'
import { prisma } from '@/server/db/client'
import { requireAuth, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { updateProfileSchema } from '@/lib/validation/profile.schema'
import { profileUpdateLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

/**
 * GET /api/profile
 * Fetch the authenticated user's OWN profile
 * RBAC: Requires authentication, always returns own profile
 */
export async function GET() {
  try {
    // RBAC: Require authentication
    const user = await requireAuth()
    const userId = user.id

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        baseLocation: true,
        phone: true,
        skills: true,
        hourlyRate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('[API] GET /api/profile error:', error)
    
    // Return proper HTTP status for auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/profile
 * Update the authenticated user's OWN profile
 * RBAC: Users can ONLY update their own profile (userId from session, not body)
 * Validation: Uses Zod schema for input validation
 */
export async function POST(request: Request) {
  try {
    // RBAC: Require authentication - always use session user ID
    // This ensures users can only update their own profile
    const user = await requireAuth()
    const userId = user.id  // Never trust userId from request body

    // Rate limiting: Prevent excessive profile updates
    const rateLimitKey = getRateLimitKey(request, userId)
    const { success, reset } = await profileUpdateLimiter.limit(rateLimitKey)
    
    if (!success) {
      return NextResponse.json(
        createRateLimitResponse(reset, 'Too many profile updates. Please try again later.'),
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input with Zod schema
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    
    const validatedInput = parsed.data

    // Build the update payload (only include fields that were provided)
    const updateData: Record<string, unknown> = {}

    if (validatedInput.name !== undefined) {
      updateData.name = validatedInput.name.trim()
    }
    if (validatedInput.bio !== undefined) {
      updateData.bio = validatedInput.bio?.trim() || null
    }
    if (validatedInput.phone !== undefined) {
      // Convert empty string to null
      updateData.phone = validatedInput.phone === '' ? null : validatedInput.phone?.trim() || null
    }
    if (validatedInput.baseLocation !== undefined) {
      updateData.baseLocation = validatedInput.baseLocation?.trim() || null
    }
    if (validatedInput.skills !== undefined) {
      // Ensure skills is stored as JSON array
      updateData.skills = validatedInput.skills || []
    }
    if (validatedInput.hourlyRate !== undefined) {
      updateData.hourlyRate = validatedInput.hourlyRate
    }
    if (validatedInput.avatarUrl !== undefined) {
      updateData.avatarUrl = validatedInput.avatarUrl || null
    }

    // Update the user profile
    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        avatarUrl: true,
        baseLocation: true,
        phone: true,
        skills: true,
        hourlyRate: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: any) {
    console.error('[API] POST /api/profile error:', error)
    
    // Handle validation errors (INVALID_INPUT from Zod)
    if (error instanceof AuthorizationError && error.code === AUTH_ERRORS.INVALID_INPUT) {
      try {
        const validationErrors = JSON.parse(error.message)
        return NextResponse.json(
          { error: 'Validation failed', details: validationErrors },
          { status: 400 }
        )
      } catch {
        return NextResponse.json(
          { error: error.message || 'Invalid input' },
          { status: 400 }
        )
      }
    }
    
    // Return proper HTTP status for auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json({ error: error.message || 'Unauthorized' }, { status })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

