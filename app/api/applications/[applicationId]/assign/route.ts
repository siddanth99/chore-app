// web/app/api/applications/[applicationId]/assign/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser, getHttpStatusForAuthError, isAuthError } from '@/server/auth/role'
import { assignApplication } from '@/server/api/applications'

// In Next 15, params is a Promise
type AssignParams = Promise<{ applicationId: string }>

/**
 * POST /api/applications/[applicationId]/assign
 * Assign a worker to a chore
 * Role is UI-only - any authenticated user who owns the chore can assign
 */
export async function POST(
  request: Request,
  { params }: { params: AssignParams }
) {
  try {
    // Any authenticated user can assign if they own the chore (ownership check happens in assignApplication)
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { applicationId } = await params

    // Security: customerId comes from session, not from client
    const result = await assignApplication(applicationId, user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error assigning application:', error)
    
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