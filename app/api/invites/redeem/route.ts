import {
  canPostUnderSoftLaunch,
  redeemInviteCode,
  softLaunchInvitesEnabled,
} from "@/lib/invites";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const enabled = await softLaunchInvitesEnabled();
  const gate = await canPostUnderSoftLaunch(session.user.id);

  return jsonOk({
    softLaunch: enabled,
    canPost: gate.allowed,
    reason: gate.reason,
  });
}

export async function POST(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const rl = await rateLimit(
    clientKey(request, `invite:${session.user.id}`),
    10,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many redeem attempts", 429);
  }

  const body = await request.json().catch(() => null);
  const code =
    body && typeof body === "object"
      ? String((body as { code?: unknown }).code ?? "")
      : "";

  try {
    const invite = await redeemInviteCode(session.user.id, code);

    return jsonOk({
      ok: true,
      code: invite.code,
      redeemedAt: invite.redeemedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not redeem invite",
      400,
    );
  }
}
