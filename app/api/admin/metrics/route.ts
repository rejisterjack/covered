import { getAdminMetrics } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const metrics = await getAdminMetrics();

    return jsonOk({ metrics });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load metrics",
      500,
    );
  }
}
