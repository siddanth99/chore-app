import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'
import { createWorkerPayout } from '@/server/api/payouts'

const KEY_ID = process.env.RAZORPAY_KEY_ID
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

/**
 * POST /api/chores/[choreId]/approve
 * 
 * Client approves completion and releases payment.
 * 
 * State machine: COMPLETED → CLOSED
 * 
 * Requirements:
 * - User must be the chore owner (client)
 * - Chore status must be COMPLETED
 * 
 * Note: Worker payout will be implemented in a future step
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

    // Verify user is the chore owner
    if (chore.createdById !== user.id) {
      return NextResponse.json(
        { error: 'Only the chore owner can approve completion' },
        { status: 403 }
      )
    }

    // Verify chore status is COMPLETED
    if (chore.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Cannot approve chore. Chore status must be COMPLETED, but it is ${chore.status}` },
        { status: 400 }
      )
    }

    // Check if there's an open dispute for this chore
    const openDispute = await prisma.dispute.findFirst({
      where: {
        choreId,
        status: {
          in: ['OPEN', 'IN_REVIEW'],
        },
      },
    })

    if (openDispute) {
      return NextResponse.json(
        {
          error: 'Cannot approve while dispute is open. Please resolve the dispute first.',
          disputeId: openDispute.id,
        },
        { status: 400 }
      )
    }

    // Find the associated payment record to get transferId
    const payment = await prisma.razorpayPayment.findFirst({
      where: {
        choreId,
        status: 'SUCCESS', // Only release if payment was successful
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // If chore is FUNDED, ensure payout is created
    // Note: We don't await this to avoid blocking the response
    if (chore.paymentStatus === 'FUNDED' && chore.assignedWorkerId) {
      // Trigger payout creation asynchronously (don't block response)
      createWorkerPayout(choreId).catch((error) => {
        console.error('Error creating payout after approval:', error)
        // Payout can be retried manually if this fails
      })
    }

    // Update chore: change status to CLOSED
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
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

    return NextResponse.json(
      {
        ok: true,
        chore: updatedChore,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error approving chore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

