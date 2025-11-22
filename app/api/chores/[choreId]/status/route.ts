import { NextRequest, NextResponse } from 'next/server'
import { markChoreInProgress, markChoreCompleted } from '@/server/api/chores'
import { requireAuth } from '@/server/auth/role'

/**
 * PATCH /api/chores/[choreId]/status - Update chore status (assigned worker only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { choreId: string } }
) {
  try {
    const user = await requireAuth()
    const { choreId } = params
    const body = await request.json()
    const { action } = body

    if (action === 'start') {
      const chore = await markChoreInProgress(choreId, user.id)
      return NextResponse.json({ chore })
    } else if (action === 'complete') {
      const chore = await markChoreCompleted(choreId, user.id)
      return NextResponse.json({ chore })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "complete"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error updating chore status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update chore status' },
      { status: 400 }
    )
  }
}

