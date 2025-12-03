import { prisma } from '../db/client'
import { createNotification } from './notifications'
import { maybeSendExternalNotification } from '../notifications'
import { NotificationType } from '@prisma/client'

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

  // Get recipient info for external notification
  const recipient = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, email: true },
  })

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
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  // Notify the recipient about the new message
  try {
    await createNotification({
      userId: toUserId,
      type: NotificationType.SYSTEM,
      choreId,
      title: 'New message',
      message: `${message.fromUser.name} sent you a message about "${message.chore?.title || 'the chore'}"`,
      link: `/chores/${choreId}`,
    })

    // Send external notification to recipient (non-blocking)
    if (process.env.PABBLY_WEBHOOK_URL && recipient?.email) {
      maybeSendExternalNotification({
        userId: toUserId,
        email: recipient.email,
        event: 'chat.message',
        title: 'New message',
        message: `${message.fromUser.name} sent you a message about "${message.chore?.title || 'the chore'}"`,
        link: `/chores/${choreId}`,
        meta: { choreId, messageId: message.id },
      }).catch((e) => console.error('External notif error', e))
    }
  } catch (error) {
    // Don't fail message sending if notification fails
    console.error('Failed to create notification for chat message:', error)
  }

  return message
}

