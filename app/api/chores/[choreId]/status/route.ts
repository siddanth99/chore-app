// web/app/api/chores/[choreId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getHttpStatusForAuthError, isAuthError, AuthorizationError, AUTH_ERRORS } from '@/server/auth/role'
import { markChoreInProgress, markChoreCompleted } from '@/server/api/chores'

type StatusParams = {
  choreId: string
}

/**
 * PATCH /api/chores/[choreId]/status
 * Start or complete a chore (available to any assigned user, regardless of role)
 * Security: userId comes from session, and user must be assigned to the chore
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<StatusParams> }
) {
  try {
    // Require authentication (no role restriction - any assigned user can start/complete)
    const user = await requireAuth()

    const { choreId } = await context.params

    if (!choreId) {
      return NextResponse.json(
        { error: 'Missing choreId in route params' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const action = body.action as 'start' | 'complete' | undefined

    if (action !== 'start' && action !== 'complete') {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "complete".' },
        { status: 400 }
      )
    }

    // Security: workerId comes from session, not from client
    const updatedChore =
      action === 'start'
        ? await markChoreInProgress(choreId, user.id)
        : await markChoreCompleted(choreId, user.id)

    return NextResponse.json(updatedChore)
  } catch (error: any) {
    console.error('Error updating chore status:', error)
    
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