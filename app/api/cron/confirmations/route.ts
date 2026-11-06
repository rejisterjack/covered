import {
  expireOverdueOpenBills,
  expireStaleConfirmations,
} from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

// Hobby cron expressions may run only once per day. vercel.json registers this
// path once per UTC hour so the 24-hour confirmation window is swept hourly.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return unauthorized();
  }

  try {
    const [confirmations, overdue] = await Promise.all([
      expireStaleConfirmations(),
      expireOverdueOpenBills(),
    ]);

    return jsonOk({
      ok: true,
      processed: confirmations.processed,
      expired: overdue.expired,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cron failed",
      500,
    );
  }
}
