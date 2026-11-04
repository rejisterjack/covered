import { expireStaleConfirmations } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return unauthorized();
  }

  try {
    const result = await expireStaleConfirmations();

    return jsonOk({ ok: true, ...result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cron failed",
      500,
    );
  }
}
