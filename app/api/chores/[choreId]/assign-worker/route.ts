import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { prisma } from '@/server/db/client'
import { ChoreStatus } from '@prisma/client'

/**
 * POST /api/chores/[choreId]/assign-worker
 * 
 * Assign a worker to a chore (client-only action).
 * 
 * State machine: OPEN → ASSIGNED
 * 
 * Requirements:
 * - User must be the chore owner (client)
 * - Chore status must be OPEN
 * - Worker must have applied to the chore
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
    const body = await request.json().catch(() => null)
    const { workerId } = body ?? {}

    if (!workerId) {
      return NextResponse.json(
        { error: 'Missing workerId in request body' },
        { status: 400 }
      )
    }

    // Fetch chore with relations
    const chore = await prisma.chore.findUnique({
      where: { id: choreId },
      include: {
        createdBy: true,
        applications: {
          where: { workerId },
        },
      },
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
        { error: 'Only the chore owner can assign workers' },
        { status: 403 }
      )
    }

    // Verify chore status is OPEN
    if (chore.status !== 'OPEN') {
      return NextResponse.json(
        { error: `Cannot assign worker. Chore status must be OPEN, but it is ${chore.status}` },
        { status: 400 }
      )
    }

    // Verify worker has applied
    if (!chore.applications || chore.applications.length === 0) {
      return NextResponse.json(
        { error: 'Worker has not applied to this chore' },
        { status: 400 }
      )
    }

    // Verify worker exists
    const worker = await prisma.user.findUnique({
      where: { id: workerId },
    })

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      )
    }

    // Validate worker has completed payout onboarding
    if (!worker.razorpayAccountId) {
      return NextResponse.json(
        { error: 'Worker has not completed payout onboarding. They must enable payouts before being assigned to a job.' },
        { status: 400 }
      )
    }

    // Update chore: assign worker and change status
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        status: 'ASSIGNED',
        assignedWorkerId: workerId,
        assignedAt: new Date(),
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

    // Update application status to ACCEPTED
    await prisma.application.updateMany({
      where: {
        choreId,
        workerId,
      },
      data: {
        status: 'ACCEPTED',
      },
    })

    // Reject other applications
    await prisma.application.updateMany({
      where: {
        choreId,
        workerId: { not: workerId },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
      },
    })

    return NextResponse.json({ chore: updatedChore }, { status: 200 })
  } catch (error) {
    console.error('Error assigning worker to chore:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

