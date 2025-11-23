// web/server/api/cancellations.ts
import { prisma } from '../db/client'
import { ChoreStatus, CancellationRequestStatus, NotificationType } from '@prisma/client'
import { createNotification } from './notifications'

/**
 * Worker requests cancellation for an assigned/in-progress chore
 */
export async function requestCancellation(
  choreId: string,
  workerId: string,
  reason?: string
) {
  // Load chore
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      cancellationRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  // Ensure worker is assigned
  if (chore.assignedWorkerId !== workerId) {
    throw new Error('Only the assigned worker can request cancellation')
  }

  // Ensure status is ASSIGNED or IN_PROGRESS
  if (chore.status !== ChoreStatus.ASSIGNED && chore.status !== ChoreStatus.IN_PROGRESS) {
    throw new Error('Chore must be ASSIGNED or IN_PROGRESS to request cancellation')
  }

  // Check if there's already a pending request
  if (chore.cancellationRequests.length > 0) {
    throw new Error('A pending cancellation request already exists for this chore')
  }

  // Create cancellation request and update chore status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.cancellationRequest.create({
      data: {
        choreId,
        requestedById: workerId,
        originalStatus: chore.status,
        reason: reason || null,
        status: CancellationRequestStatus.PENDING,
      },
    })

    const updatedChore = await tx.chore.update({
      where: { id: choreId },
      data: {
        status: ChoreStatus.CANCELLATION_REQUESTED,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedWorker: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return { chore: updatedChore, request }
  })

  // Notify the customer
  await createNotification({
    userId: result.chore.createdById,
    type: NotificationType.CANCELLATION_REQUESTED,
    choreId: choreId,
    title: 'Cancellation requested',
    message: `${result.chore.assignedWorker?.name || 'The worker'} requested cancellation for "${result.chore.title}"`,
    link: `/chores/${choreId}`,
  })

  return result
}

/**
 * Customer decides on a worker's cancellation request
 */
export async function decideCancellation(
  choreId: string,
  customerId: string,
  decision: 'APPROVE' | 'REJECT'
) {
  // Load chore with latest pending cancellation request
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      cancellationRequests: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  // Ensure customer is the owner
  if (chore.createdById !== customerId) {
    throw new Error('Only the chore owner can decide on cancellation requests')
  }

  // Ensure status is CANCELLATION_REQUESTED
  if (chore.status !== ChoreStatus.CANCELLATION_REQUESTED) {
    throw new Error('Chore must be in CANCELLATION_REQUESTED status')
  }

  // Ensure there's a pending request
  if (chore.cancellationRequests.length === 0) {
    throw new Error('No pending cancellation request found')
  }

  const request = chore.cancellationRequests[0]

  // Update in transaction
  const result = await prisma.$transaction(async (tx) => {
    if (decision === 'APPROVE') {
      // Approve: set chore to CANCELLED, mark request as APPROVED
      const updatedChore = await tx.chore.update({
        where: { id: choreId },
        data: {
          status: ChoreStatus.CANCELLED,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          assignedWorker: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      const updatedRequest = await tx.cancellationRequest.update({
        where: { id: request.id },
        data: {
          status: CancellationRequestStatus.APPROVED,
          resolvedAt: new Date(),
        },
      })

      return { chore: updatedChore, request: updatedRequest }
    } else {
      // Reject: restore original status, mark request as REJECTED
      const updatedChore = await tx.chore.update({
        where: { id: choreId },
        data: {
          status: request.originalStatus,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          assignedWorker: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      const updatedRequest = await tx.cancellationRequest.update({
        where: { id: request.id },
        data: {
          status: CancellationRequestStatus.REJECTED,
          resolvedAt: new Date(),
        },
      })

      return { chore: updatedChore, request: updatedRequest }
    }
  })

  // Notify the worker
  if (result.chore.assignedWorkerId) {
    await createNotification({
      userId: result.chore.assignedWorkerId,
      type: NotificationType.CANCELLATION_DECIDED,
      choreId: choreId,
      title: 'Cancellation decision',
      message: `"${result.chore.title}" cancellation was ${decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'}`,
      link: `/chores/${choreId}`,
    })
  }

  return result
}

/**
 * Customer directly cancels a chore (before assignment)
 */
export async function customerDirectCancel(
  choreId: string,
  customerId: string,
  reason?: string
) {
  // Load chore
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  // Ensure customer is the owner
  if (chore.createdById !== customerId) {
    throw new Error('Only the chore owner can cancel')
  }

  // Ensure status is DRAFT or PUBLISHED
  if (chore.status !== ChoreStatus.DRAFT && chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore must be DRAFT or PUBLISHED to cancel directly')
  }

  // Create cancellation request (for history) and update chore in transaction
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.cancellationRequest.create({
      data: {
        choreId,
        requestedById: customerId,
        originalStatus: chore.status,
        reason: reason || null,
        status: CancellationRequestStatus.APPROVED,
        resolvedAt: new Date(),
      },
    })

    const updatedChore = await tx.chore.update({
      where: { id: choreId },
      data: {
        status: ChoreStatus.CANCELLED,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedWorker: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return { chore: updatedChore, request }
  })

  return result
}

