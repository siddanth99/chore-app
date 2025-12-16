import { prisma } from '../db/client'
import { createNotification } from './notifications'
import { maybeSendExternalNotification } from '../notifications'
import { NotificationType } from '@prisma/client'

/**
 * List messages for a specific chore
 * Supports both pre-assignment (applicants can chat) and post-assignment (only assigned worker) modes
 */
export async function listMessages(choreId: string, userId: string) {
  // Verify user has access to this chore
  const chore = await prisma.chore.findUnique({
    where: { id: choreId },
    select: {
      createdById: true,
      assignedWorkerId: true,
      status: true,
      applications: {
        where: { workerId: userId },
        select: { id: true, status: true },
      },
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  const isOwner = chore.createdById === userId
  const isAssignedWorker = chore.assignedWorkerId === userId
  const hasApplication = chore.applications.length > 0

  // POST-ASSIGNMENT: Only owner and assigned worker can access
  if (chore.assignedWorkerId) {
    if (!isOwner && !isAssignedWorker) {
      throw new Error('You do not have access to this conversation')
    }
    
    // Determine the other party's ID
    const otherUserId = isOwner ? chore.assignedWorkerId : chore.createdById
    
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

  // PRE-ASSIGNMENT: Owner can chat with any applicant, applicants can chat with owner
  if (isOwner) {
    // Owner can see all messages to/from any applicant
    const messages = await prisma.chatMessage.findMany({
      where: {
        choreId,
        OR: [
          { fromUserId: userId }, // Messages sent by owner
          { toUserId: userId },   // Messages received by owner
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

  // Worker must have applied (and not be rejected) to chat in pre-assignment mode
  if (!hasApplication) {
    throw new Error('You must apply to this chore before you can send messages')
  }

  const application = chore.applications[0]
  if (application.status === 'REJECTED') {
    throw new Error('Your application was rejected. You cannot send messages.')
  }

  // Worker can chat with owner in pre-assignment mode
  const messages = await prisma.chatMessage.findMany({
    where: {
      choreId,
      OR: [
        { fromUserId: userId, toUserId: chore.createdById },
        { fromUserId: chore.createdById, toUserId: userId },
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
 * Supports both pre-assignment (applicants can chat) and post-assignment (only assigned worker) modes
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
      status: true,
      applications: {
        where: { workerId: userId },
        select: { id: true, status: true },
      },
    },
  })

  if (!chore) {
    throw new Error('Chore not found')
  }

  const isOwner = chore.createdById === userId
  const isAssignedWorker = chore.assignedWorkerId === userId
  const hasApplication = chore.applications.length > 0

  let toUserId: string | null = null

  // POST-ASSIGNMENT: Only owner and assigned worker can send messages
  if (chore.assignedWorkerId) {
    if (!isOwner && !isAssignedWorker) {
      throw new Error('You do not have access to this conversation')
    }
    
    // Determine the recipient's ID
    toUserId = isOwner ? chore.assignedWorkerId : chore.createdById
  } 
  // PRE-ASSIGNMENT: Owner can chat with applicants, applicants can chat with owner
  else {
    if (isOwner) {
      // In pre-assignment mode, owner can message any applicant
      // For simplicity, if owner has sent messages before, use the most recent recipient
      // Otherwise, use the first pending applicant
      const recentMessage = await prisma.chatMessage.findFirst({
        where: {
          choreId,
          fromUserId: userId,
        },
        orderBy: { createdAt: 'desc' },
        select: { toUserId: true },
      })
      
      if (recentMessage?.toUserId) {
        // Owner has messaged someone before, continue that conversation
        toUserId = recentMessage.toUserId
      } else {
        // First time messaging, use the first pending applicant
        const firstApplicant = await prisma.application.findFirst({
          where: {
            choreId,
            status: 'PENDING',
          },
          select: { workerId: true },
          orderBy: { createdAt: 'asc' },
        })
        
        if (!firstApplicant) {
          throw new Error('Cannot send message: no pending applicants to message')
        }
        
        toUserId = firstApplicant.workerId
      }
    } else {
      // Worker must have applied (and not be rejected) to send messages in pre-assignment mode
      if (!hasApplication) {
        throw new Error('You must apply to this chore before you can send messages')
      }

      const application = chore.applications[0]
      if (application.status === 'REJECTED') {
        throw new Error('Your application was rejected. You cannot send messages.')
      }

      // Worker sends to owner in pre-assignment mode
      toUserId = chore.createdById
    }
  }

  if (!toUserId) {
    throw new Error('Cannot send message: invalid recipient')
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

