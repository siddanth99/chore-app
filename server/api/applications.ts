// web/server/api/applications.ts
import { prisma } from '../db/client'
import { ApplicationStatus, ChoreStatus, NotificationType } from '@prisma/client'
import { createNotification } from './notifications'
import { maybeSendExternalNotification } from '../notifications'

export interface CreateApplicationInput {
  choreId: string
  workerId: string
  bidAmount?: number
  message?: string
}

export async function createApplication(input: CreateApplicationInput) {
  // Validate chore exists and is PUBLISHED
  const chore = await prisma.chore.findUnique({
    where: { id: input.choreId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore is not available for applications')
  }

  // Check if worker has already applied to this chore
  const existing = await prisma.application.findFirst({
    where: {
      choreId: input.choreId,
      workerId: input.workerId,
    },
  })

  if (existing) {
    throw new Error('You have already applied to this chore.')
  }

  // Get worker info for notification
  const worker = await prisma.user.findUnique({
    where: { id: input.workerId },
    select: { name: true },
  })

  // Create the application
  const application = await prisma.application.create({
    data: {
      choreId: input.choreId,
      workerId: input.workerId,
      bidAmount: input.bidAmount ?? null,
      message: input.message ?? null,
      status: ApplicationStatus.PENDING,
    },
  })

  // Notify the chore owner
  await createNotification({
    userId: chore.createdById,
    type: NotificationType.APPLICATION_SUBMITTED,
    choreId: chore.id,
    applicationId: application.id,
    title: 'New application received',
    message: `${worker?.name || 'A worker'} applied to your chore "${chore.title}"`,
    link: `/chores/${chore.id}`,
  })

  // Send external notification (non-blocking)
  if (process.env.PABBLY_WEBHOOK_URL && chore.createdBy?.email) {
    maybeSendExternalNotification({
      userId: chore.createdById,
      email: chore.createdBy.email,
      event: 'application.submitted',
      title: 'New application received',
      message: `${worker?.name || 'A worker'} applied to your chore "${chore.title}"`,
      link: `/chores/${chore.id}`,
      meta: { choreId: chore.id, applicationId: application.id },
    }).catch((e: any) => console.error('External notif error', e))
  }

  return application
}

export async function assignApplication(
  applicationId: string,
  customerId: string
) {
  // Load the application and its chore
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      chore: true,
    },
  })

  if (!application) {
    throw new Error('Application not found')
  }

  // Only the owner of the chore can assign
  if (application.chore.createdById !== customerId) {
    throw new Error('You are not allowed to assign this chore')
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new Error('Only pending applications can be assigned')
  }

  // Only allow assignment when chore is PUBLISHED
  if (application.chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore must be PUBLISHED to be assigned')
  }

  // Do everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1) Update the chore
    const updatedChore = await tx.chore.update({
      where: { id: application.choreId },
      data: {
        status: ChoreStatus.ASSIGNED,
        assignedWorkerId: application.workerId,
      },
    })

    // 2) Reject all other pending applications for this chore
    await tx.application.updateMany({
      where: {
        choreId: application.choreId,
        status: ApplicationStatus.PENDING,
        NOT: { id: application.id },
      },
      data: { status: ApplicationStatus.REJECTED },
    })

    // 3) Mark this application as ACCEPTED
    const acceptedApplication = await tx.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.ACCEPTED },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      chore: updatedChore,
      application: acceptedApplication,
    }
  })

  // Notify the assigned worker
  await createNotification({
    userId: application.workerId,
    type: NotificationType.CHORE_ASSIGNED,
    choreId: application.choreId,
    applicationId: application.id,
    title: "You've been assigned a chore",
    message: `You've been assigned to "${application.chore.title}"`,
    link: `/chores/${application.choreId}`,
  })

  // Send external notification to assigned worker (non-blocking)
  if (process.env.PABBLY_WEBHOOK_URL && result.application.worker?.email) {
    maybeSendExternalNotification({
      userId: application.workerId,
      email: result.application.worker.email,
      event: 'chore.assigned',
      title: "You've been assigned a chore",
      message: `You've been assigned to "${application.chore.title}"`,
      link: `/chores/${application.choreId}`,
      meta: { choreId: application.choreId, applicationId: application.id },
    }).catch((e: any) => console.error('External notif error', e))
  }

  // Notify rejected workers (optional - can be done in batch)
  const rejectedApplications = await prisma.application.findMany({
    where: {
      choreId: application.choreId,
      status: ApplicationStatus.REJECTED,
      NOT: { id: application.id },
    },
    include: {
      worker: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  })

  // Notify each rejected worker
  for (const rejectedApp of rejectedApplications) {
    await createNotification({
      userId: rejectedApp.workerId,
      type: NotificationType.APPLICATION_REJECTED,
      choreId: application.choreId,
      applicationId: rejectedApp.id,
      title: 'Application not selected',
      message: `Your application for "${application.chore.title}" was not selected`,
      link: `/chores/${application.choreId}`,
    })

    // Send external notification to rejected worker (non-blocking)
    if (process.env.PABBLY_WEBHOOK_URL && rejectedApp.worker?.email) {
      maybeSendExternalNotification({
        userId: rejectedApp.workerId,
        email: rejectedApp.worker.email,
        event: 'application.rejected',
        title: 'Application not selected',
        message: `Your application for "${application.chore.title}" was not selected`,
        link: `/chores/${application.choreId}`,
        meta: { choreId: application.choreId, applicationId: rejectedApp.id },
      }).catch((e: any) => console.error('External notif error', e))
    }
  }

  return result
}

export async function listApplicationsForWorkerDashboard(workerId: string) {
  return prisma.application.findMany({
    where: {
      workerId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          budget: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// List applications for a specific chore (CUSTOMER-only, owner check)
export async function listApplicationsForChore(
  choreId: string,
  customerId: string
) {
  // Ensure the chore exists and belongs to this customer
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: { createdById: true },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.createdById !== customerId) {
    throw new Error('You are not allowed to view applications for this chore')
  }

  // Return all applications for this chore with worker info
  const applications = await prisma.application.findMany({
    where: { choreId },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch worker ratings for each application
  const { getAverageRating } = await import('./ratings')
  const applicationsWithRatings = await Promise.all(
    applications.map(async (app) => {
      const rating = await getAverageRating(app.workerId)
      return {
        ...app,
        workerAverageRating: rating.average,
        workerRatingCount: rating.count,
      }
    })
  )

  return applicationsWithRatings
}

// List all applications for a worker (for "My Applications" page, etc.)
export async function listApplicationsForWorker(workerId: string) {
  return prisma.application.findMany({
    where: {
      workerId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          budget: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}