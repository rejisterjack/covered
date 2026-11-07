import { listPendingConfirmations } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const bills = await listPendingConfirmations();

    return jsonOk({
      bills: bills.map((bill) => ({
        id: bill.id,
        amount: Number(bill.amount),
        category: bill.category,
        story: bill.story,
        updatedAt: bill.updatedAt.toISOString(),
        poster: bill.poster,
        payment: bill.payments[0]
          ? {
              id: bill.payments[0].id,
              donor: bill.payments[0].donor,
              donorMarkedAt: bill.payments[0].donorMarkedAt.toISOString(),
            }
          : null,
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load pending",
      500,
    );
  }
}
