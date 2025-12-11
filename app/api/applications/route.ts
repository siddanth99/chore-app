import { NextResponse } from 'next/server'
import { getCurrentUser, getHttpStatusForAuthError, isAuthError } from '@/server/auth/role'
import { listApplicationsForWorkerDashboard } from '@/server/api/applications'

/**
 * GET /api/applications
 * Returns the current user's OWN applications
 * Role is UI-only, not permission-based - any authenticated user can view their applications
 */
export async function GET() {
  try {
    // Any authenticated user can view their own applications regardless of role
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Security: Only returns applications for the session user
    const applications = await listApplicationsForWorkerDashboard(user.id)

    return NextResponse.json({ applications })
  } catch (error: any) {
    console.error('Error in GET /api/applications:', error)

    // Handle structured auth/business errors
    if (isAuthError(error)) {
      const status = getHttpStatusForAuthError(error)
      return NextResponse.json(
        { error: error.message || 'Operation failed' },
        { status }
      )
    }
    
    // Generic 500 for unknown errors (don't leak details)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}