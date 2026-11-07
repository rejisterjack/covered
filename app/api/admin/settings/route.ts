import { getPlatformSettings } from "@/lib/admin";
import { updatePausePosting } from "@/lib/admin-ops";
import { gateAdminMutation, gateAdminRead } from "@/lib/admin-api";
import { softLaunchInvitesEnabled, updateSoftLaunchInvites } from "@/lib/invites";
import { jsonError, jsonOk } from "@/lib/http";

function serializeSettings(
  settings: Awaited<ReturnType<typeof getPlatformSettings>>,
  softLaunchEffective: boolean,
) {
  return {
    pausePosting: settings.pausePosting,
    softLaunchInvites: settings.softLaunchInvites,
    softLaunchEffective,
    updatedAt: settings.updatedAt.toISOString(),
    updatedById: settings.updatedById,
  };
}

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const settings = await getPlatformSettings();
    const softLaunchEffective = await softLaunchInvitesEnabled();

    return jsonOk({
      settings: serializeSettings(settings, softLaunchEffective),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to load settings",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  const gated = await gateAdminMutation(request);

  if (gated.error) return gated.error;

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid body");
  }

  const patch = body as {
    pausePosting?: unknown;
    softLaunchInvites?: unknown;
  };

  if (
    typeof patch.pausePosting !== "boolean" &&
    typeof patch.softLaunchInvites !== "boolean"
  ) {
    return jsonError("pausePosting or softLaunchInvites boolean required");
  }

  try {
    if (typeof patch.pausePosting === "boolean") {
      await updatePausePosting(patch.pausePosting, gated.admin.user.id);
    }
    if (typeof patch.softLaunchInvites === "boolean") {
      await updateSoftLaunchInvites(
        patch.softLaunchInvites,
        gated.admin.user.id,
      );
    }

    const settings = await getPlatformSettings();
    const softLaunchEffective = await softLaunchInvitesEnabled();

    return jsonOk({
      settings: serializeSettings(settings, softLaunchEffective),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to update settings",
      400,
    );
  }
}
