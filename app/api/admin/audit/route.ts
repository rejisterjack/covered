import { listAuditLogs } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const logs = await listAuditLogs();

    return jsonOk({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        meta: log.meta,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load audit",
      500,
    );
  }
}
