import { isAdminEmail } from "@/lib/admin-allowlist";
import { listVerificationRequests, searchUsers } from "@/lib/admin-ops";
import { gateAdminRead } from "@/lib/admin-api";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const gated = await gateAdminRead(request);

  if (gated.error) return gated.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    if (searchParams.get("requests") === "1") {
      const requests = await listVerificationRequests();

      return jsonOk({
        requests: requests.map((user) => ({
          ...user,
          verificationRequestedAt: user.verificationRequestedAt?.toISOString(),
        })),
      });
    }

    const users = await searchUsers(q);

    return jsonOk({
      users: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        allowlisted: isAdminEmail(user.email),
      })),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to search users",
      500,
    );
  }
}
