/** Browser helper for R2 presigned uploads (falls back to data URL in dev). */
export async function uploadFile(
  file: File,
  purpose: "bill" | "qr" | "screenshot" | "avatar",
) {
  const presign = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type || "image/jpeg",
      contentLength: file.size,
      purpose,
    }),
  });
  const data = await presign.json();

  if (!presign.ok) {
    throw new Error(data.error ?? "Upload failed");
  }

  if (data.devMode || !data.uploadUrl) {
    const reader = new FileReader();

    return new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const put = await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });

  if (!put.ok) {
    throw new Error("Failed to upload file");
  }

  return data.publicUrl as string;
}
