// web/server/api/applications.ts
import { prisma } from '../db/client'
import { ApplicationStatus, ChoreStatus } from '@prisma/client'

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
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.status !== ChoreStatus.PUBLISHED) {
    throw new Error('Chore is not available for applications')
  }

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
  return prisma.application.findMany({
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