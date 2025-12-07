// web/server/api/notifications.ts
import { prisma } from '../db/client'
import { NotificationType } from '@prisma/client'

// Try to use the queue enqueue helper. If it doesn't exist or REDIS is not configured,
// fallback to immediate external send via maybeSendExternalNotification.
import { maybeSendExternalNotification } from '@/server/notifications'
let enqueueNotificationJob: ((id: string, payload?: Record<string, any>) => Promise<any>) | null = null
try {
  // dynamic require to avoid top-level hard crash if file missing
  // and to keep this code runnable in environments without Redis.
  // The queue module was added at server/notifications/queue.ts
  // which exports enqueueNotificationJob.
  // We keep this optional so dev without Redis works fine.
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  const queueMod = require('@/server/notifications/queue')
  enqueueNotificationJob = queueMod.enqueueNotificationJob
} catch (e) {
  // queue not available — that's fine, fallback will be used
  enqueueNotificationJob = null
}

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
 * Create a new notification, then enqueue it for external delivery.
 * Fallbacks:
 * - If enqueue helper exists and REDIS_URL is set, job will be enqueued.
 * - Otherwise, we call maybeSendExternalNotification synchronously (dev fallback).
 */
export async function createNotification(input: CreateNotificationInput) {
  const created = await prisma.notification.create({
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

  // Try enqueueing to Redis-backed queue if available.
  try {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    if (enqueueNotificationJob && redisUrl) {
      // We pass a small payload to the worker; worker can re-read DB if needed.
      void enqueueNotificationJob(created.id, {
        userId: created.userId,
      }).catch((err: any) => {
        console.error('Failed to enqueue notification job, falling back to direct send:', err)
        // Fallback: attempt direct send
        void maybeSendExternalNotification({
          notificationId: created.id,
          userId: created.userId,
          event: created.type,
          title: created.title,
          message: created.message,
          link: created.link ?? undefined,
        }).catch((e: any) => {
          console.error('Fallback direct send failed for notification', created.id, e)
        })
      })
    } else {
      // No queue available — immediate send (development fallback).
      await maybeSendExternalNotification({
        notificationId: created.id,
        userId: created.userId,
        event: created.type,
        title: created.title,
        message: created.message,
        link: created.link ?? undefined,
      })
    }
  } catch (err) {
    console.error('Notification delivery enqueue/send error (non-fatal):', err)
  }

  return created
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

