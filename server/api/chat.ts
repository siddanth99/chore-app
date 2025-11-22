import { prisma } from '../db/client'

/**
 * List messages for a specific chore
 * Only accessible by the customer who created the chore or the assigned worker
 */
export async function listMessages(choreId: string, userId: string) {
  // Verify user has access to this chore
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: {
      createdById: true,
      assignedWorkerId: true,
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  const isOwner = chore.createdById === userId
  const isAssignedWorker = chore.assignedWorkerId === userId

  if (!isOwner && !isAssignedWorker) {
    throw new Error('You do not have access to this conversation')
  }

  // Determine the other party's ID
  const otherUserId = isOwner ? chore.assignedWorkerId : chore.createdById

  if (!otherUserId) {
    // No assigned worker yet, return empty messages
    return []
  }

  // Query messages between the two parties for this chore
  const messages = await prisma.chatMessage.findMany({
    where: {
      choreId,
      OR: [
        { fromUserId: userId, toUserId: otherUserId },
        { fromUserId: otherUserId, toUserId: userId },
      ],
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return messages
}

/**
 * Send a message in a chore conversation
 * Only accessible by the customer who created the chore or the assigned worker
 */
export async function sendMessage(choreId: string, userId: string, content: string) {
  // Validate content
  if (!content || !content.trim()) {
    throw new Error('Message content cannot be empty')
  }

  // Verify user has access to this chore
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: {
      createdById: true,
      assignedWorkerId: true,
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  const isOwner = chore.createdById === userId
  const isAssignedWorker = chore.assignedWorkerId === userId

  if (!isOwner && !isAssignedWorker) {
    throw new Error('You do not have access to this conversation')
  }

  // Determine the recipient's ID
  const toUserId = isOwner ? chore.assignedWorkerId : chore.createdById

  if (!toUserId) {
    throw new Error('Cannot send message: no assigned worker yet')
  }

  // Create the message
  const message = await prisma.chatMessage.create({
    data: {
      choreId,
      fromUserId: userId,
      toUserId,
      content: content.trim(),
    },
    include: {
      fromUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return message
}

