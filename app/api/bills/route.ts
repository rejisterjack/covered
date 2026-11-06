import { BillCategory } from "@prisma/client";

import { createBill, listBills, type FeedTab } from "@/lib/bills";
import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { serializeBillCard } from "@/lib/serializers";
import { requireUser } from "@/lib/session";
import { createBillSchema, feedQuerySchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = feedQuerySchema.safeParse({
    tab: searchParams.get("tab") ?? "new",
    category: searchParams.get("category") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    radiusKm: searchParams.get("radiusKm") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid query");
  }

  const near =
    parsed.data.lat != null &&
    parsed.data.lng != null &&
    parsed.data.radiusKm != null
      ? {
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          radiusKm: parsed.data.radiusKm,
        }
      : undefined;

  const bills = await listBills({
    tab: parsed.data.tab as FeedTab,
    category: parsed.data.category as BillCategory | undefined,
    cursor: parsed.data.cursor,
    near,
  });

  return jsonOk({
    bills: bills.map((bill) => serializeBillCard(bill)),
  });
}

export async function POST(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const rl = await rateLimit(
    clientKey(request, `post:${session.user.id}`),
    5,
    60_000,
  );

  if (!rl.ok) {
    return jsonError("Too many posts. Try again shortly.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = createBillSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid body");
  }

  try {
    const bill = await createBill({
      posterId: session.user.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      billerName: parsed.data.billerName,
      referenceNo: parsed.data.referenceNo,
      dueDate: parsed.data.dueDate,
      story: parsed.data.story ?? "",
      imageUrl: parsed.data.imageUrl,
      paymentHandle: parsed.data.paymentHandle,
      paymentType: parsed.data.paymentType,
      paymentQrUrl: parsed.data.paymentQrUrl ?? undefined,
      locationCity: parsed.data.locationCity ?? undefined,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });

    return jsonOk({ bill: serializeBillCard(bill) }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create bill";
    const status =
      message === "Posting paused" || message.includes("Invite required")
        ? 403
        : 400;

    return jsonError(message, status);
  }
}
