import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 8 * 1024 * 1024;

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 is not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function assertAllowedUpload(
  contentType: string,
  contentLength: number,
) {
  if (!ALLOWED_MIME.has(contentType)) {
    throw new Error("Unsupported file type");
  }
  if (contentLength <= 0 || contentLength > MAX_BYTES) {
    throw new Error("File too large (max 8MB)");
  }
}

export async function createPresignedUpload(input: {
  key: string;
  contentType: string;
  contentLength: number;
}) {
  assertAllowedUpload(input.contentType, input.contentLength);

  const bucket = process.env.R2_BUCKET_NAME ?? "covered";
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 120 });
  const publicUrl = `${env.r2PublicUrl.replace(/\/$/, "")}/${input.key}`;

  return { uploadUrl, publicUrl, key: input.key, expiresIn: 120 };
}

export { ALLOWED_MIME, MAX_BYTES };
