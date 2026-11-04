import { confirmBillPayment } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { serializeBillCard } from "@/lib/serializers";
import { requireUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;

  try {
    const bill = await confirmBillPayment({
      billId: id,
      posterId: session.user.id,
    });

    if (!bill) {
      return jsonError("Bill not found", 404);
    }

    return jsonOk({
      bill: serializeBillCard(bill),
      status: "covered",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to confirm",
      400,
    );
  }
}
