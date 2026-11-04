import { z } from "zod";

import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { savePushSubscription } from "@/lib/push";
import { requireUser } from "@/lib/session";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid subscription");
  }

  await savePushSubscription({
    userId: session.user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
  });

  return jsonOk({ ok: true });
}
