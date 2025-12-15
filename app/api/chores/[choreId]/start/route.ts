import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'

/**
 * POST /api/chores/[choreId]/start
 * 
 * Worker starts the job (begins work on the chore).
 * 
 * State machine: FUNDED → IN_PROGRESS
 * 
 * Requirements:
 * - User must be the assigned worker
 * - Chore status must be FUNDED (escrow must be funded)
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
        { error: 'Only the assigned worker can start this chore' },
        { status: 403 }
      )
    }

    // Verify chore status is FUNDED
    if (chore.status !== 'FUNDED') {
      return NextResponse.json(
        { error: `Cannot start chore. Chore status must be FUNDED, but it is ${chore.status}. Payment must be completed first.` },
        { status: 400 }
      )
    }

    // Verify payment status is FUNDED
    if (chore.paymentStatus !== 'FUNDED') {
      return NextResponse.json(
        { error: 'Cannot start chore. Payment must be completed and escrow must be funded.' },
        { status: 400 }
      )
    }

    // Update chore: change status to IN_PROGRESS
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
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
    console.error('Error starting chore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

