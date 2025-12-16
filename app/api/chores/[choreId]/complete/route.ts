import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'
import { createWorkerPayout } from '@/server/api/payouts'

/**
 * POST /api/chores/[choreId]/complete
 * 
 * Worker marks the job as complete.
 * 
 * State machine: IN_PROGRESS → COMPLETED
 * 
 * Requirements:
 * - User must be the assigned worker
 * - Chore status must be IN_PROGRESS
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
        { error: 'Only the assigned worker can complete this chore' },
        { status: 403 }
      )
    }

    // Verify chore status is IN_PROGRESS
    if (chore.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Cannot complete chore. Chore status must be IN_PROGRESS, but it is ${chore.status}` },
        { status: 400 }
      )
    }

    // Update chore: change status to COMPLETED
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            email: true,
            upiId: true,
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

    // If payment is FUNDED, trigger payout creation in background
    // Note: We don't await this to avoid blocking the response
    // The payout will be created asynchronously
    if (updatedChore.paymentStatus === 'FUNDED' && updatedChore.assignedWorker?.upiId) {
      // Trigger payout creation asynchronously (don't block response)
      createWorkerPayout(choreId).catch((error) => {
        console.error('Error creating payout after completion:', error)
        // Payout can be retried manually if this fails
      })
    }

    return NextResponse.json({ chore: updatedChore }, { status: 200 })
  } catch (error) {
    console.error('Error completing chore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

