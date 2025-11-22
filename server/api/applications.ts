import { prisma } from '../db/client'
import { ApplicationStatus, ChoreStatus } from '@prisma/client'

export interface CreateApplicationInput {
  choreId: string
  workerId: string
  bidAmount?: number
  message?: string
}

/**
 * Create a new application/bid for a chore (WORKER only)
 */
export async function createApplication(input: CreateApplicationInput) {
  // Validate chore exists and is PUBLISHED
  const chore = await prisma.chore.findUnique({
    where: { id: input.choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore is not available for applications')
  }

  // Check for existing application (PENDING or ACCEPTED)
  const existingApplication = await prisma.application.findFirst({
    where: {
      choreId: input.choreId,
      workerId: input.workerId,
      status: {
        in: [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED],
      },
    },
  })

  if (existingApplication) {
    throw new Error('You have already applied for this chore')
  }

  // Create the application
  const application = await prisma.application.create({
    data: {
      choreId: input.choreId,
      workerId: input.workerId,
      bidAmount: input.bidAmount,
      message: input.message,
      status: ApplicationStatus.PENDING,
    },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  })

  return application
}

/**
 * List applications for a specific chore (CUSTOMER only - must own the chore)
 */
export async function listApplicationsForChore(choreId: string, customerId: string) {
  // Verify the chore belongs to the customer
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.createdById !== customerId) {
    throw new Error('You do not have permission to view applications for this chore')
  }

  // Get all applications for this chore
  const applications = await prisma.application.findMany({
    where: { choreId },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return applications
}

/**
 * List all applications made by a specific worker
 */
export async function listApplicationsForWorker(workerId: string) {
  const applications = await prisma.application.findMany({
    where: { workerId },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          type: true,
          budget: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return applications
}

/**
 * Assign a chore to a worker by accepting their application
 */
export async function assignApplication(applicationId: string, customerId: string) {
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

  const chore = application.chore

  // Validate ownership
  if (chore.createdById !== customerId) {
    throw new Error('You do not have permission to assign this chore')
  }

  // Validate chore status
  if (chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore is not available for assignment')
  }

  // Validate application status
  if (application.status !== ApplicationStatus.PENDING) {
    throw new Error('Application is not pending')
  }

  // Use a transaction to update everything atomically
  const result = await prisma.$transaction(async (tx) => {
    // Accept the selected application
    const acceptedApplication = await tx.application.update({
      where: { id: applicationId },
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

    // Reject all other PENDING applications for this chore
    await tx.application.updateMany({
      where: {
        choreId: chore.id,
        status: ApplicationStatus.PENDING,
        id: { not: applicationId },
      },
      data: { status: ApplicationStatus.REJECTED },
    })

    // Update the chore
    const updatedChore = await tx.chore.update({
      where: { id: chore.id },
      data: {
        status: ChoreStatus.ASSIGNED,
        assignedWorkerId: application.workerId,
      },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
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

    return { application: acceptedApplication, chore: updatedChore }
  })

  return result
}

/**
 * List applications for worker dashboard (simplified version)
 */
export async function listApplicationsForWorkerDashboard(workerId: string) {
  const applications = await prisma.application.findMany({
    where: { workerId },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          budget: true,
          locationAddress: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10, // Limit for dashboard
  })

  return applications
}

