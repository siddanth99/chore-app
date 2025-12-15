import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'

/**
 * POST /api/chores/[choreId]/worker-accept
 * 
 * Worker accepts assignment (acknowledges they're assigned).
 * 
 * State machine: ASSIGNED → ASSIGNED (no status change, just acknowledgment)
 * 
 * Requirements:
 * - User must be the assigned worker
 * - Chore status must be ASSIGNED
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { choreId } = await context.params

    // Fetch chore
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
    })

    if (!chore) {
      return NextResponse.json(
        { error: 'Chore not found' },
        { status: 404 }
      )
    }

    // Verify user is the assigned worker
    if (chore.assignedWorkerId !== user.id) {
      return NextResponse.json(
        { error: 'Only the assigned worker can accept this assignment' },
        { status: 403 }
      )
    }

    // Verify chore status is ASSIGNED
    if (chore.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: `Cannot accept assignment. Chore status must be ASSIGNED, but it is ${chore.status}` },
        { status: 400 }
      )
    }

    // No status change needed - this is just an acknowledgment
    // Status will change to FUNDED when payment is captured
    const updatedChore = await prisma.chore.findUnique({
      where: { id: choreId },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ chore: updatedChore }, { status: 200 })
  } catch (error) {
    console.error('Error in worker-accept:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

