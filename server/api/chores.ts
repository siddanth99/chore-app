import { prisma } from '../db/client'
import { ChoreType, ChoreStatus } from '@prisma/client'

export interface CreateChoreInput {
  title: string
  description: string
  type: ChoreType
  category: string
  budget?: number
  locationAddress?: string
  locationLat?: number
  locationLng?: number
  dueAt?: string
  createdById: string
}

/**
 * Create a new chore (for CUSTOMER role)
 */
export async function createChore(input: CreateChoreInput) {
  const chore = await prisma.chore.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      budget: input.budget,
      locationAddress: input.locationAddress,
      locationLat: input.locationLat,
      locationLng: input.locationLng,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdById: input.createdById,
      status: ChoreStatus.PUBLISHED,
    },
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

  return chore
}

/**
 * List published chores (public listing for workers)
 */
export async function listPublishedChores() {
  const chores = await prisma.chore.findMany({
    where: {
      status: ChoreStatus.PUBLISHED,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return chores
}

/**
 * Get a single chore by ID
 */
export async function getChoreById(choreId?: string) {
  // If no id was provided, avoid calling Prisma and just return null
  if (!choreId) {
    return null
  }

  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedWorker: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  })

  return chore
}

/**
 * Mark a chore as IN_PROGRESS (assigned worker only)
 */
export async function markChoreInProgress(choreId: string, workerId: string) {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.assignedWorkerId !== workerId) {
    throw new Error('Only the assigned worker can start this chore')
  }

  if (chore.status !== ChoreStatus.ASSIGNED) {
    throw new Error('Chore must be ASSIGNED before it can be started')
  }

  const updatedChore = await prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.IN_PROGRESS },
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

  return updatedChore
}

/**
 * Mark a chore as COMPLETED (assigned worker only)
 */
export async function markChoreCompleted(choreId: string, workerId: string) {
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.assignedWorkerId !== workerId) {
    throw new Error('Only the assigned worker can complete this chore')
  }

  if (chore.status !== ChoreStatus.IN_PROGRESS) {
    throw new Error('Chore must be IN_PROGRESS before it can be completed')
  }

  const updatedChore = await prisma.chore.update({
    where: { id: choreId },
    data: { status: ChoreStatus.COMPLETED },
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

  return updatedChore
}

/**
 * List all chores for a specific customer
 */
export async function listChoresForCustomer(customerId: string) {
  const chores = await prisma.chore.findMany({
    where: {
      createdById: customerId,
    },
    include: {
      assignedWorker: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return chores
}

/**
 * List chores assigned to a specific worker
 */
export async function listAssignedChoresForWorker(workerId: string) {
  const chores = await prisma.chore.findMany({
    where: {
      assignedWorkerId: workerId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  return chores
}

/**
 * List nearby offline chores for a worker based on their baseLocation
 */
export async function listNearbyOfflineChores(workerId: string) {
  const worker = await prisma.user.findUnique({
    where: { id: workerId },
    select: { baseLocation: true },
  })

  if (!worker || !worker.baseLocation) {
    return []
  }

  const chores = await prisma.chore.findMany({
    where: {
      type: ChoreType.OFFLINE,
      status: ChoreStatus.PUBLISHED,
      locationAddress: {
        contains: worker.baseLocation,
        mode: 'insensitive',
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return chores
}

/**
 * List published chores with optional filters
 */
export async function listPublishedChoresWithFilters(filters?: {
  type?: ChoreType | string
  location?: string
}) {
  const where: any = {
    status: ChoreStatus.PUBLISHED,
  }

  // Only apply type filter if provided and valid
  if (filters?.type && filters.type !== 'ALL') {
    const typeUpper = String(filters.type).toUpperCase()
    if (typeUpper === 'ONLINE' || typeUpper === 'OFFLINE') {
      where.type = typeUpper as ChoreType
    }
  }

  // Only apply location filter if location string exists and is not empty
  if (filters?.location && filters.location.trim().length > 0) {
    where.locationAddress = {
      contains: filters.location.trim(),
      mode: 'insensitive',
    }
  }

  const chores = await prisma.chore.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return chores
}

