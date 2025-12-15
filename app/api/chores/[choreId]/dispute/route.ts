import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus, DisputeStatus } from '@prisma/client'

type CreateDisputeParams = {
  choreId: string
}

/**
 * POST /api/chores/[choreId]/dispute
 * 
 * Client-only route to raise a dispute for a chore.
 * Only the chore owner (client) can raise a dispute.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ choreId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only clients can raise disputes
    if (user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only clients can raise disputes' },
        { status: 403 }
      )
    }

    const { choreId } = await context.params

    const body = await req.json().catch(() => null)
    const { reason } = body ?? {}

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

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
        { error: 'Only the chore owner can raise a dispute' },
        { status: 403 }
      )
    }

    // Validate chore status - disputes can be raised for COMPLETED, FUNDED, or IN_PROGRESS chores
    const DISPUTE_ELIGIBLE_STATUSES: ChoreStatus[] = [
      ChoreStatus.COMPLETED,
      ChoreStatus.FUNDED,
      ChoreStatus.IN_PROGRESS,
    ]

    if (!DISPUTE_ELIGIBLE_STATUSES.includes(chore.status)) {
      return NextResponse.json(
        {
          error: `Cannot raise dispute. Chore status must be COMPLETED, FUNDED, or IN_PROGRESS, but it is ${chore.status}`,
        },
        { status: 400 }
      )
    }

    // Check if there's already an OPEN dispute for this chore
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        choreId,
        status: {
          in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW],
        },
      },
    })

    if (existingDispute) {
      return NextResponse.json(
        { error: 'An open dispute already exists for this chore' },
        { status: 400 }
      )
    }

    // Create dispute and update chore status to CLIENT_REVIEW
    const dispute = await prisma.$transaction(async (tx) => {
      const newDispute = await tx.dispute.create({
        data: {
          choreId,
          userId: user.id,
          reason: reason.trim(),
          status: DisputeStatus.OPEN,
        },
        include: {
          chore: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Update chore status to CLIENT_REVIEW
      await tx.chore.update({
        where: { id: choreId },
        data: {
          status: ChoreStatus.CLIENT_REVIEW,
        },
      })

      return newDispute
    })

    return NextResponse.json(
      {
        dispute: {
          id: dispute.id,
          choreId: dispute.choreId,
          reason: dispute.reason,
          status: dispute.status,
          createdAt: dispute.createdAt,
          chore: dispute.chore,
          user: dispute.user,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dispute:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

