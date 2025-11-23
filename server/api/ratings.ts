import { prisma } from '../db/client'
import { ChoreStatus } from '@prisma/client'

export interface AddRatingInput {
  choreId: string
  fromUserId: string
  score: number
  comment?: string
}

/**
 * Add or update a rating for a completed chore
 * Only the customer (chore creator) can rate the assigned worker
 */
export async function addRating(input: AddRatingInput) {
  // Validate score
  if (input.score < 1 || input.score > 5) {
    throw new Error('Rating score must be between 1 and 5')
  }

  // Load chore to validate and find the worker to rate
  const chore = await prisma.chore.findUnique({
    where: { id: input.choreId },
    select: {
      createdById: true,
      assignedWorkerId: true,
      status: true,
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.status !== ChoreStatus.COMPLETED) {
    throw new Error('Ratings can only be submitted for completed chores')
  }

  // Only the customer (createdBy) may rate the worker
  if (input.fromUserId !== chore.createdById) {
    throw new Error('Only the customer who created this chore can rate it')
  }

  if (!chore.assignedWorkerId) {
    throw new Error('No assigned worker to rate')
  }

  const toUserId = chore.assignedWorkerId

  // Use upsert to allow updating existing ratings
  const rating = await prisma.rating.upsert({
    where: {
      choreId_fromUserId: {
        choreId: input.choreId,
        fromUserId: input.fromUserId,
      },
    },
    update: {
      score: input.score,
      comment: input.comment ?? null,
    },
    create: {
      choreId: input.choreId,
      fromUserId: input.fromUserId,
      toUserId,
      score: input.score,
      comment: input.comment ?? null,
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return rating
}

/**
 * Get all ratings for a specific user (ratings received by them)
 */
export async function getRatingsForUser(userId: string) {
  const ratings = await prisma.rating.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return ratings
}

/**
 * Get average rating for a user
 */
export async function getAverageRating(userId: string) {
  const result = await prisma.rating.aggregate({
    where: { toUserId: userId },
    _avg: {
      score: true,
    },
    _count: {
      score: true,
    },
  })

  return {
    average: result._avg.score || 0,
    count: result._count.score || 0,
  }
}

/**
 * Get rating for a specific chore by a specific user
 */
export async function getRatingForChoreAndUser(choreId: string, userId: string) {
  const rating = await prisma.rating.findUnique({
    where: {
      choreId_fromUserId: {
        choreId,
        fromUserId: userId,
      },
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return rating
}

/**
 * Get rating for a specific chore (any rating for this chore)
 */
export async function getRatingForChore(choreId: string) {
  const rating = await prisma.rating.findFirst({
    where: { choreId },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
        },
      },
      toUser: {
        select: {
          id: true,
          name: true,
        },
      },
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return rating
}