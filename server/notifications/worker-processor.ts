// server/notifications/worker-processor.ts

import { prisma } from '@/server/db/client';

// Try to import the existing external sender.

// If this path or function differs, detect and update automatically.

import { maybeSendExternalNotification } from '@/server/notifications';

export async function processNotificationJob(notificationId: string) {

  if (!notificationId) throw new Error('Missing notificationId');

  const notif = await prisma.notification.findUnique({

    where: { id: notificationId },

    include: {

      user: { select: { id: true, email: true, phone: true } },

      chore: { select: { id: true, title: true } },

      application: { select: { id: true } },

      payment: { select: { id: true } },

    },

  });

  if (!notif) {

    console.warn(`Notification ${notificationId} not found`);

    return { ok: false, reason: 'not_found' };

  }

  const payload = {

    notificationId: notif.id,

    userId: notif.userId,

    email: notif.user?.email ?? null,

    phone: notif.user?.phone ?? null,

    channel: 'any' as 'email' | 'sms' | 'whatsapp' | 'any',

    event: notif.type,

    title: notif.title,

    message: notif.message,

    link: notif.link ?? null,

    meta: {

      choreId: notif.choreId ?? null,

      applicationId: notif.applicationId ?? null,

      paymentId: notif.paymentId ?? null,

    },

  };

  try {

    const res = await maybeSendExternalNotification(payload);

    return { ok: true, result: res ?? null };

  } catch (err) {

    console.error('Worker external send failed:', err);

    throw err; // allow BullMQ retry

  }

}

