import { setUserPostingLocked } from "@/lib/admin-ops";
import { gateAdminMutation } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const gated = await gateAdminMutation(request);

  if (gated.error) return gated.error;

  const { id } = await params;

  try {
    const user = await setUserPostingLocked(id, false, gated.admin.user.id);

    return jsonOk({
      user: { id: user.id, postingLocked: user.postingLocked },
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to unlock user",
      400,
    );
  }
}
