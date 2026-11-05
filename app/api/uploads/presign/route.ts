import { randomUUID } from "crypto";

import { createPresignedUpload } from "@/lib/r2";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { presignSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const rl = await rateLimit(
    clientKey(request, `upload:${session.user.id}`),
    20,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many uploads", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = presignSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid body");
  }

  const ext =
    parsed.data.contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const key = `${parsed.data.purpose}/${session.user.id}/${randomUUID()}.${ext}`;

  try {
    const result = await createPresignedUpload({
      key,
      contentType: parsed.data.contentType,
      contentLength: parsed.data.contentLength,
    });

    return jsonOk(result);
  } catch (error) {
    // Dev fallback when R2 is not configured: return a placeholder data URL workflow
    if (
      error instanceof Error &&
      error.message.includes("R2 is not configured")
    ) {
      return jsonOk({
        uploadUrl: null,
        publicUrl: null,
        key,
        expiresIn: 0,
        devMode: true,
        message:
          "R2 is not configured. Upload the file as a data URL or configure R2.",
      });
    }

    return jsonError(
      error instanceof Error ? error.message : "Presign failed",
      400,
    );
  }
}
