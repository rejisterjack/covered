import { flagBill } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { flagSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;
  const rl = rateLimit(
    clientKey(request, `flag:${session.user.id}`),
    10,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many flags", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = flagSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid reason");
  }

  try {
    const result = await flagBill({
      billId: id,
      flaggedBy: session.user.id,
      reason: parsed.data.reason,
    });

    return jsonOk(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to flag bill";
    const status = message.includes("Unique") ? 409 : 400;

    return jsonError(
      message.includes("Unique") ? "Already flagged" : message,
      status,
    );
  }
}
