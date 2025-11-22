import { prisma } from '../db/client'

export interface AddRatingInput {
  choreId: string
  raterId: string
  rateeId: string
  score: number
  comment?: string
}

/**
 * Add a rating for a completed chore
 */
export async function addRating(input: AddRatingInput) {
  // Validate score
  if (input.score < 1 || input.score > 5) {
    throw new Error('Rating score must be between 1 and 5')
  }

  // Verify the chore exists and is completed
  const chore = await prisma.chore.findUnique({
    where: { id: input.choreId },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  if (chore.status !== 'COMPLETED') {
    throw new Error('Can only rate completed chores')
  }

  // Verify the rater is either the customer or the assigned worker
  const isCustomer = chore.createdById === input.raterId
  const isWorker = chore.assignedWorkerId === input.raterId

  if (!isCustomer && !isWorker) {
    throw new Error('Only the customer or assigned worker can rate')
  }

  // Verify the ratee is the other party
  const expectedRateeId = isCustomer ? chore.assignedWorkerId : chore.createdById
  if (input.rateeId !== expectedRateeId) {
    throw new Error('Invalid rating target')
  }

  // Check if rating already exists
  const existingRating = await prisma.rating.findUnique({
    where: {
      choreId_fromUserId: {
        choreId: input.choreId,
        fromUserId: input.raterId,
      },
    },
  })

  if (existingRating) {
    throw new Error('You have already rated this chore')
  }

  // Create the rating
  const rating = await prisma.rating.create({
    data: {
      choreId: input.choreId,
      fromUserId: input.raterId,
      toUserId: input.rateeId,
      score: input.score,
      comment: input.comment || null,
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
 * Get all ratings for a specific user
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

