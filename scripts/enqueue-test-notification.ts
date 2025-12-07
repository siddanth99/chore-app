// scripts/enqueue-test-notification.ts

import 'dotenv/config';

import { enqueueNotificationJob } from '@/server/notifications/queue';

async function main() {

  const id = process.argv[2];

  if (!id) {

    console.error('Usage: ts-node scripts/enqueue-test-notification.ts <notificationId>');

    process.exit(1);

  }

  await enqueueNotificationJob(id);

  console.log('Enqueued notification job for', id);

  process.exit(0);

}

main().catch((e) => {

  console.error(e);

  process.exit(1);

});

