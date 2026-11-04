import webpush from "web-push";

import { prisma } from "@/lib/prisma";

function configureVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject =
    process.env.VAPID_SUBJECT ?? "mailto:ops@covered.rejisterjack.com";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  return true;
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
) {
  if (!configureVapid()) {
    return { sent: 0, skipped: true };
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url: url ?? "/" }),
      );
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" &&
        error &&
        "statusCode" in error &&
        typeof (error as { statusCode?: number }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }

  return { sent, skipped: false };
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: input,
    update: {
      userId: input.userId,
      p256dh: input.p256dh,
      auth: input.auth,
    },
  });
}
