import {
  listInviteCodes,
  mintInviteCode,
  softLaunchInvitesEnabled,
} from "@/lib/invites";
import { gateAdminMutation, gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const [codes, enabled] = await Promise.all([
      listInviteCodes(100),
      softLaunchInvitesEnabled(),
    ]);

    return jsonOk({
      enabled,
      invites: codes.map((row) => ({
        id: row.id,
        code: row.code,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt?.toISOString() ?? null,
        redeemedAt: row.redeemedAt?.toISOString() ?? null,
        createdBy: row.createdBy,
        redeemedBy: row.redeemedBy,
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to list invites",
      500,
    );
  }
}

export async function POST(request: Request) {
  const gated = await gateAdminMutation(request);

  if (gated.error) return gated.error;

  const body = await request.json().catch(() => ({}));
  const count =
    typeof body === "object" &&
    body &&
    typeof (body as { count?: unknown }).count === "number"
      ? (body as { count: number }).count
      : 1;

  try {
    const codes = await mintInviteCode({
      actorId: gated.admin.user.id,
      count,
    });

    return jsonOk({ codes }, { status: 201 });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to mint invites",
      400,
    );
  }
}
