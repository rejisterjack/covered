import type { Bill, Payment, User } from "@prisma/client";

type BillWithPoster = Bill & {
  poster: Pick<User, "id" | "name" | "city" | "image" | "isVerifiedPublic">;
  coveredBy?: Pick<
    User,
    "id" | "name" | "city" | "image" | "isVerifiedPublic"
  > | null;
};

export function publicName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "Someone";

  return first;
}

export function serializeBillCard(bill: BillWithPoster) {
  return {
    id: bill.id,
    amount: Number(bill.amount),
    currency: bill.currency,
    category: bill.category,
    billerName: bill.billerName,
    referenceNo: bill.referenceNo,
    dueDate: bill.dueDate.toISOString(),
    story: bill.story,
    imageUrl: bill.imageUrl,
    locationCity: bill.locationCity ?? bill.poster.city,
    status: bill.status,
    viewsCount: bill.viewsCount,
    coverIntentCount: bill.coverIntentCount,
    createdAt: bill.createdAt.toISOString(),
    coveredAt: bill.coveredAt?.toISOString() ?? null,
    poster: {
      id: bill.poster.id,
      firstName: publicName(bill.poster.name),
      city: bill.poster.city,
      image: bill.poster.image,
      isVerifiedPublic: bill.poster.isVerifiedPublic,
    },
    coveredBy: bill.coveredBy
      ? {
          id: bill.coveredBy.id,
          firstName: publicName(bill.coveredBy.name),
          isVerifiedPublic: bill.coveredBy.isVerifiedPublic,
        }
      : null,
  };
}

export function serializeBillDetail(
  bill: BillWithPoster,
  opts: {
    includePayment: boolean;
    viewerId?: string | null;
  },
) {
  const base = serializeBillCard(bill);
  const isPoster = opts.viewerId === bill.posterId;

  return {
    ...base,
    payment:
      opts.includePayment || isPoster
        ? {
            paymentHandle: bill.paymentHandle,
            paymentType: bill.paymentType,
            paymentQrUrl: bill.paymentQrUrl,
          }
        : null,
    isPoster,
  };
}

export function serializeLeaderboardRow(
  user: Pick<
    User,
    | "id"
    | "name"
    | "image"
    | "city"
    | "isVerifiedPublic"
    | "totalGiven"
    | "billsCovered"
  >,
  rank: number,
  opts?: { anonymous?: boolean; periodTotal?: number; periodCount?: number },
) {
  const anonymous = opts?.anonymous;

  return {
    rank,
    id: user.id,
    name: anonymous ? "Anonymous" : publicName(user.name),
    image: anonymous ? null : user.image,
    city: anonymous ? null : user.city,
    isVerifiedPublic: anonymous ? false : user.isVerifiedPublic,
    totalGiven: opts?.periodTotal ?? Number(user.totalGiven),
    billsCovered: opts?.periodCount ?? user.billsCovered,
  };
}

export function serializePayment(payment: Payment) {
  return {
    id: payment.id,
    billId: payment.billId,
    donorId: payment.donorId,
    amount: Number(payment.amount),
    isAnonymous: payment.isAnonymous,
    screenshotUrl: payment.screenshotUrl,
    donorMarkedAt: payment.donorMarkedAt.toISOString(),
    posterConfirmedAt: payment.posterConfirmedAt?.toISOString() ?? null,
  };
}
