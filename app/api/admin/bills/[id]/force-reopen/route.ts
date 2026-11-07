import { forceReopenBill } from "@/lib/admin-ops";
import { gateAdminMutation } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const gated = await gateAdminMutation(request);

  if (gated.error) return gated.error;

  const { id } = await params;

  try {
    const bill = await forceReopenBill(id, gated.admin.user.id);

    return jsonOk({ bill: { id: bill.id, status: bill.status } });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to force-reopen",
      400,
    );
  }
}
