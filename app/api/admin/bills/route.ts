import { searchBills } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const bills = await searchBills(q);

    return jsonOk({
      bills: bills.map((bill) => ({
        id: bill.id,
        amount: Number(bill.amount),
        category: bill.category,
        story: bill.story,
        status: bill.status,
        deletedAt: bill.deletedAt?.toISOString() ?? null,
        createdAt: bill.createdAt.toISOString(),
        poster: bill.poster,
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to search bills",
      500,
    );
  }
}
