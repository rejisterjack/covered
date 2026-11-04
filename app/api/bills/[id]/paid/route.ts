import { markBillPaid } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { serializePayment } from "@/lib/serializers";
import { requireUser } from "@/lib/session";
import { markPaidSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;
  const rl = rateLimit(
    clientKey(request, `paid:${session.user.id}`),
    10,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many requests", 429);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = markPaidSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid body");
  }

  try {
    const result = await markBillPaid({
      billId: id,
      donorId: session.user.id,
      isAnonymous: parsed.data.isAnonymous,
      screenshotUrl: parsed.data.screenshotUrl,
    });

    return jsonOk({
      payment: serializePayment(result.payment),
      status: "pending_confirmation",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to mark paid",
      400,
    );
  }
}
