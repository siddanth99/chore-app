import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole, getHttpStatusForAuthError, isAuthError } from '@/server/auth/role'
import { listApplicationsForWorkerDashboard } from '@/server/api/applications'

/**
 * GET /api/applications
 * Returns the current worker's OWN applications
 * Security: workerId always comes from session - never allows viewing other workers' applications
 */
export async function GET() {
  try {
    // RBAC: Only workers can view applications
    const user = await requireRole(UserRole.WORKER)

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