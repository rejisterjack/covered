import { listFlaggedBills } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const bills = await listFlaggedBills();

    return jsonOk({
      bills: bills.map((bill) => ({
        id: bill.id,
        amount: Number(bill.amount),
        category: bill.category,
        story: bill.story,
        status: bill.status,
        updatedAt: bill.updatedAt.toISOString(),
        poster: bill.poster,
        flags: bill.flags.map((f) => ({
          id: f.id,
          reason: f.reason,
          flaggedBy: f.flaggedBy,
          createdAt: f.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load flags",
      500,
    );
  }
}
