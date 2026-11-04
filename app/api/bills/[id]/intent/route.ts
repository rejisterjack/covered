import { recordCoverIntent } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { serializeBillDetail } from "@/lib/serializers";
import { requireUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;
  const rl = rateLimit(
    clientKey(request, `intent:${session.user.id}`),
    30,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many requests", 429);
  }

  try {
    const bill = await recordCoverIntent(id, session.user.id);

    if (!bill) {
      return jsonError("Bill not found", 404);
    }

    return jsonOk({
      bill: serializeBillDetail(bill, {
        includePayment: true,
        viewerId: session.user.id,
      }),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to record intent",
      400,
    );
  }
}
