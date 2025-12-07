// server/notifications/queue.ts

import { Queue } from 'bullmq';

const connectionUrl = process.env.REDIS_URL;

if (!connectionUrl) {

  throw new Error('REDIS_URL is required for notification queue');

}

export const NOTIFICATION_QUEUE_NAME =

  process.env.NOTIFICATION_QUEUE_NAME || 'notifications';

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {

  connection: { host: connectionUrl, port: 6379 } as any, // ConnectionOptions type

  defaultJobOptions: {

    removeOnComplete: 1000,

    removeOnFail: 1000,

    attempts: 5,

    backoff: { type: 'exponential', delay: 1000 },

  },

});

export async function enqueueNotificationJob(

  notificationId: string,

  payload: Record<string, any> = {}

) {

  return notificationQueue.add(

    'deliver-notification',

    { notificationId, ...payload },

    { jobId: `notif:${notificationId}:${Date.now()}` }

  );

}

