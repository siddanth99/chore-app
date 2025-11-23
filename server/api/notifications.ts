// web/server/api/notifications.ts
import { prisma } from '../db/client'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  choreId?: string
  applicationId?: string
  paymentId?: string
  title: string
  message: string
  link?: string
}

/**
 * Create a new notification
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      choreId: input.choreId ?? null,
      applicationId: input.applicationId ?? null,
      paymentId: input.paymentId ?? null,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    },
  })
}

/**
 * List notifications for a user
 */
export async function listNotificationsForUser(
  userId: string,
  opts?: { onlyUnread?: boolean }
) {
  const where: any = { userId }
  if (opts?.onlyUnread) {
    where.isRead = false
  }

  return prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
        },
      },
      application: {
        select: {
          id: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  })
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string) {
  // Ensure the notification belongs to the user
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { userId: true },
  })

  if (!notification || notification.userId !== userId) {
    throw new Error('Notification not found or unauthorized')
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })
}

