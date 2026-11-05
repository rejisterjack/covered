import { requireAdmin } from "@/lib/admin";
import { forbidden, jsonError, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getSessionFromRequest } from "@/lib/session";

export async function gateAdminMutation(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session?.user) {
    return { error: unauthorized() };
  }

  const admin = await requireAdmin(request);

  if (!admin) {
    return { error: forbidden() };
  }

  const rl = await rateLimit(
    clientKey(request, `admin:${admin.user.id}`),
    60,
    60_000,
  );

  if (!rl.ok) {
    return { error: jsonError("Too many admin actions", 429) };
  }

  return { admin };
}

export async function gateAdminRead(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session?.user) {
    return { error: unauthorized() };
  }

  const admin = await requireAdmin(request);

  if (!admin) {
    return { error: forbidden() };
  }

  return { admin };
}
