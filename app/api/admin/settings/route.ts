import { getPlatformSettings } from "@/lib/admin";
import { updatePausePosting } from "@/lib/admin-ops";
import { gateAdminMutation, gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  try {
    const settings = await getPlatformSettings();

    return jsonOk({
      settings: {
        pausePosting: settings.pausePosting,
        updatedAt: settings.updatedAt.toISOString(),
        updatedById: settings.updatedById,
      },
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

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { pausePosting?: unknown }).pausePosting !== "boolean"
  ) {
    return jsonError("pausePosting boolean required");
  }

  try {
    const settings = await updatePausePosting(
      (body as { pausePosting: boolean }).pausePosting,
      gated.admin.user.id,
    );

    return jsonOk({
      settings: {
        pausePosting: settings.pausePosting,
        updatedAt: settings.updatedAt.toISOString(),
        updatedById: settings.updatedById,
      },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to update settings",
      400,
    );
  }
}
