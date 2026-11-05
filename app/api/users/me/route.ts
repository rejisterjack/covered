import { jsonError, jsonOk, unauthorized } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  return jsonOk({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      city: user.city,
      upiId: user.upiId,
      image: user.image,
      isAnonymousDefault: user.isAnonymousDefault,
      isVerifiedPublic: user.isVerifiedPublic,
      verificationRequestedAt: user.verificationRequestedAt?.toISOString() ?? null,
      postingLocked: user.postingLocked,
      totalGiven: Number(user.totalGiven),
      billsCovered: user.billsCovered,
      billsPosted: user.billsPosted,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await requireUser(request);

  if (!session) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid body");
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isVerifiedPublic: true },
  });

  if (!current) {
    return jsonError("User not found", 404);
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
      ...(parsed.data.upiId !== undefined ? { upiId: parsed.data.upiId } : {}),
      ...(parsed.data.isAnonymousDefault !== undefined
        ? { isAnonymousDefault: parsed.data.isAnonymousDefault }
        : {}),
      ...(parsed.data.verificationRequest && !current.isVerifiedPublic
        ? { verificationRequestedAt: new Date() }
        : {}),
    },
  });

  return jsonOk({
    user: {
      id: user.id,
      name: user.name,
      city: user.city,
      upiId: user.upiId,
      isAnonymousDefault: user.isAnonymousDefault,
      isVerifiedPublic: user.isVerifiedPublic,
      verificationRequestedAt:
        user.verificationRequestedAt?.toISOString() ?? null,
    },
  });
}
