import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { createApplication } from '@/server/api/applications'
import { applicationCreationLimiter, getRateLimitKey, createRateLimitResponse } from '@/lib/rate-limit'

// Next.js 14+ — dynamic route params are a Promise and must be awaited
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    // Role is UI-only, not permission-based - any authenticated user can apply to chores
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting: Prevent spam applications
    const rateLimitKey = getRateLimitKey(request, user.id)
    const { success, reset } = await applicationCreationLimiter.limit(rateLimitKey)
    
    if (!success) {
      return NextResponse.json(
        createRateLimitResponse(reset, 'Rate limit exceeded. You can apply to more chores later.'),
        { status: 429 }
      )
    }

    // ✅ unwrap params promise
    const { choreId } = await context.params

    if (!choreId) {
      return NextResponse.json({ error: "Missing choreId" }, { status: 400 })
    }

    const body = await request.json()
    const { bidAmount, message } = body

    // Create application (includes RBAC check for self-application)
    const application = await createApplication({
      choreId,
      workerId: user.id,
      bidAmount:
        bidAmount !== undefined && bidAmount !== null
          ? Number(bidAmount)
          : undefined,
      message: message || undefined,
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating application:', error)
    
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
    
    // Return proper HTTP status for other auth errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Access denied' },
        { status }
      )
    }
    
    // Business logic errors (already applied, chore not found, etc.)
    return NextResponse.json(
      { error: error.message || 'Failed to create application' },
      { status: 400 }
    )
  }
}