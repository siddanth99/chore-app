// web/app/api/chores/[choreId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { requireRole } from '@/server/auth/role'
import { markChoreInProgress, markChoreCompleted } from '@/server/api/chores'

type StatusParams = {
  choreId: string
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<StatusParams> }
) {
  try {
    // Worker must be logged in
    const user = await requireRole(UserRole.WORKER)

    // ✅ IMPORTANT: await the params Promise
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

    const updatedChore =
      action === 'start'
        ? await markChoreInProgress(choreId, user.id)
        : await markChoreCompleted(choreId, user.id)

    return NextResponse.json(updatedChore)
  } catch (err: any) {
    console.error('Error updating chore status:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to update chore status' },
      { status: 400 }
    )
  }
}