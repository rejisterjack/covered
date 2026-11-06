import {
  BillCategory,
  BillStatus,
  FlagReason,
  PaymentType,
  Prisma,
} from "@prisma/client";
import { addHours, subHours } from "date-fns";

import { compareHotBills, utcDayStart } from "@/lib/hot";
import { dayKey, haversineKm } from "@/lib/rank";

import { isPostingPaused } from "@/lib/admin";
import {
  ACTIVE_BILL_STATUSES,
  assertCanPostBillFacts,
  normalizeReferenceNo,
} from "@/lib/bill-rules";
import { env } from "@/lib/env";
import { assertCanPostUnderSoftLaunch } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const posterSelect = {
  id: true,
  name: true,
  city: true,
  image: true,
  isVerifiedPublic: true,
} as const;

export type FeedTab = "new" | "hot" | "covered";

export async function listBills(input: {
  tab: FeedTab;
  category?: BillCategory;
  take?: number;
  cursor?: string;
  near?: { lat: number; lng: number; radiusKm: number };
}) {
  await expireStaleConfirmations();
  await expireOverdueOpenBills();
  const take = input.take ?? 20;
  // Feed never surfaces expired (or flagged) bills — only open / covered tabs.
  const where: Prisma.BillWhereInput = {
    deletedAt: null,
    status: { notIn: [BillStatus.expired, BillStatus.flagged] },
  };

  if (input.category) {
    where.category = input.category;
  }

  if (input.tab === "new") {
    where.status = BillStatus.open;

    const fresh = await prisma.bill.findMany({
      where,
      include: { poster: { select: posterSelect } },
      orderBy: { createdAt: "desc" },
      take: input.near ? 200 : take,
      ...(input.near || !input.cursor
        ? {}
        : { skip: 1, cursor: { id: input.cursor } }),
    });

    return withinRadius(fresh, input.near, take);
  }

  if (input.tab === "hot") {
    where.status = BillStatus.open;
    const start = utcDayStart();
    const day = dayKey(start);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const [tapGroups, viewGroups] = await Promise.all([
      prisma.coverIntent.groupBy({
        by: ["billId"],
        where: { createdAt: { gte: start, lt: end }, bill: where },
        _count: { _all: true },
      }),
      prisma.billViewDay.groupBy({
        by: ["billId"],
        where: { day, views: { gt: 0 }, bill: where },
        _sum: { views: true },
      }),
    ]);

    const taps = new Map(
      tapGroups.map((group) => [group.billId, group._count._all]),
    );
    const views = new Map(
      viewGroups.map((group) => [group.billId, group._sum.views ?? 0]),
    );
    const rankedIds = Array.from(new Set([...taps.keys(), ...views.keys()]))
      .sort((a, b) =>
        compareHotBills(
          { coverTapsToday: taps.get(a) ?? 0, viewsToday: views.get(a) ?? 0 },
          { coverTapsToday: taps.get(b) ?? 0, viewsToday: views.get(b) ?? 0 },
        ),
      )
      .slice(0, input.near ? 200 : take);

    if (rankedIds.length === 0) return [];

    const hot = await prisma.bill.findMany({
      where: { ...where, id: { in: rankedIds } },
      include: { poster: { select: posterSelect } },
    });

    hot.sort((a, b) =>
      compareHotBills(
        {
          coverTapsToday: taps.get(a.id) ?? 0,
          viewsToday: views.get(a.id) ?? 0,
          createdAt: a.createdAt,
        },
        {
          coverTapsToday: taps.get(b.id) ?? 0,
          viewsToday: views.get(b.id) ?? 0,
          createdAt: b.createdAt,
        },
      ),
    );

    return withinRadius(hot, input.near, take);
  }

  where.status = BillStatus.covered;
  where.coveredAt = { gte: subHours(new Date(), 1) };

  const covered = await prisma.bill.findMany({
    where,
    include: {
      poster: { select: posterSelect },
      coveredBy: { select: posterSelect },
    },
    orderBy: { coveredAt: "desc" },
    take: input.near ? 200 : take,
  });

  return withinRadius(covered, input.near, take);
}

function withinRadius<T extends { latitude: number | null; longitude: number | null }>(
  bills: T[],
  near: { lat: number; lng: number; radiusKm: number } | undefined,
  take: number,
) {
  if (!near) return bills.slice(0, take);

  return bills
    .filter(
      (bill) =>
        bill.latitude != null &&
        bill.longitude != null &&
        haversineKm(
          { lat: near.lat, lng: near.lng },
          { lat: bill.latitude, lng: bill.longitude },
        ) <= near.radiusKm,
    )
    .slice(0, take);
}

export async function createBill(input: {
  posterId: string;
  amount: number;
  category: BillCategory;
  billerName: string;
  referenceNo: string;
  dueDate: Date | string;
  story?: string | null;
  imageUrl: string;
  paymentHandle: string;
  paymentType: PaymentType;
  paymentQrUrl?: string;
  locationCity?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  if (await isPostingPaused()) {
    throw new Error("Posting paused");
  }

  await assertCanPostUnderSoftLaunch(input.posterId);

  const dueDate =
    input.dueDate instanceof Date
      ? input.dueDate
      : new Date(
          /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)
            ? `${input.dueDate}T12:00:00`
            : input.dueDate,
        );

  assertCanPostBillFacts({
    amount: input.amount,
    billerName: input.billerName,
    referenceNo: input.referenceNo,
    dueDate,
    paymentHandle: input.paymentHandle,
    paymentType: input.paymentType,
  });

  const poster = await prisma.user.findUniqueOrThrow({
    where: { id: input.posterId },
  });

  if (poster.postingLocked) {
    throw new Error("Posting is locked pending review");
  }
  if (!poster.emailVerified) {
    throw new Error("Email verification required");
  }

  const billerName = input.billerName.trim().replace(/\s+/g, " ");
  const referenceNo = normalizeReferenceNo(input.referenceNo);

  return prisma.$transaction(async (tx) => {
    const activeCount = await tx.bill.count({
      where: {
        posterId: input.posterId,
        deletedAt: null,
        status: { in: ACTIVE_BILL_STATUSES },
      },
    });

    if (activeCount > 0) {
      throw new Error(
        "You already have an open bill. Cover or clear it before posting another.",
      );
    }

    const duplicate = await tx.bill.findFirst({
      where: {
        deletedAt: null,
        status: { in: ACTIVE_BILL_STATUSES },
        referenceNo,
        billerName: { equals: billerName, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new Error(
        "This bill (biller + reference) is already open on Covered",
      );
    }

    const bill = await tx.bill.create({
      data: {
        posterId: input.posterId,
        amount: new Prisma.Decimal(input.amount),
        category: input.category,
        billerName,
        referenceNo,
        dueDate,
        story: (input.story ?? "").trim(),
        imageUrl: input.imageUrl,
        paymentHandle: input.paymentHandle.trim(),
        paymentType: input.paymentType,
        paymentQrUrl: input.paymentQrUrl,
        locationCity: input.locationCity ?? poster.city,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      },
      include: { poster: { select: posterSelect } },
    });

    await tx.user.update({
      where: { id: input.posterId },
      data: { billsPosted: { increment: 1 } },
    });

    return bill;
  });
}

export async function getBillById(id: string) {
  await expireStaleConfirmations();
  await expireOverdueOpenBills();
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      poster: { select: posterSelect },
      coveredBy: { select: posterSelect },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!bill || bill.deletedAt) {
    return null;
  }

  return bill;
}

export async function incrementBillViews(id: string) {
  const bill = await prisma.bill.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });

  if (!bill) return;

  const day = dayKey(new Date());

  await prisma.$transaction([
    prisma.bill.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    }),
    prisma.billViewDay.upsert({
      where: { billId_day: { billId: id, day } },
      create: { billId: id, day, views: 1 },
      update: { views: { increment: 1 } },
    }),
  ]);
}

export async function recordCoverIntent(billId: string, userId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });

  if (!bill || bill.deletedAt || bill.status !== BillStatus.open) {
    throw new Error("Bill is not open");
  }
  if (bill.posterId === userId) {
    throw new Error("You cannot cover your own bill");
  }

  try {
    await prisma.coverIntent.create({
      data: { billId, userId },
    });
    await prisma.bill.update({
      where: { id: billId },
      data: { coverIntentCount: { increment: 1 } },
    });
  } catch (error) {
    if (!(
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )) {
      throw error;
    }
    // already recorded — still return full bill for payment reveal
  }

  return getBillById(billId);
}

export async function markBillPaid(input: {
  billId: string;
  donorId: string;
  isAnonymous?: boolean;
  screenshotUrl: string;
}) {
  if (!input.screenshotUrl?.trim()) {
    throw new Error("Payment screenshot is required");
  }

  return prisma
    .$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({ where: { id: input.billId } });

      if (!bill || bill.deletedAt) {
        throw new Error("Bill not found");
      }
      if (bill.status !== BillStatus.open) {
        throw new Error("Bill is not open for covering");
      }
      if (bill.posterId === input.donorId) {
        throw new Error("You cannot cover your own bill");
      }

      const updated = await tx.bill.updateMany({
        where: { id: input.billId, status: BillStatus.open },
        data: {
          status: BillStatus.pending_confirmation,
          coveredById: input.donorId,
        },
      });

      if (updated.count !== 1) {
        throw new Error("Bill was just claimed by someone else");
      }

      const payment = await tx.payment.create({
        data: {
          billId: input.billId,
          donorId: input.donorId,
          amount: bill.amount,
          isAnonymous: input.isAnonymous ?? false,
          screenshotUrl: input.screenshotUrl,
        },
      });

      return { billId: bill.id, payment };
    })
    .then(async (result) => {
      const bill = await getBillById(result.billId);

      if (bill) {
        await sendPushToUser(
          bill.posterId,
          "Someone covered your bill",
          "Confirm receipt within 24 hours.",
          `/bills/${bill.id}`,
        );
      }

      return result;
    });
}

export async function confirmBillPayment(input: {
  billId: string;
  posterId: string;
}) {
  return prisma
    .$transaction(async (tx) => {
      const bill = await tx.bill.findUnique({
        where: { id: input.billId },
        include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      if (!bill) {
        throw new Error("Bill not found");
      }
      if (bill.posterId !== input.posterId) {
        throw new Error("Only the poster can confirm");
      }
      if (bill.status !== BillStatus.pending_confirmation) {
        throw new Error("Bill is not awaiting confirmation");
      }

      const payment = bill.payments[0];

      if (!payment) {
        throw new Error("No payment to confirm");
      }

      const now = new Date();

      await tx.payment.update({
        where: { id: payment.id },
        data: { posterConfirmedAt: now },
      });

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          status: BillStatus.covered,
          coveredAt: now,
          coveredById: payment.donorId,
        },
      });

      await tx.user.update({
        where: { id: payment.donorId },
        data: {
          totalGiven: { increment: payment.amount },
          billsCovered: { increment: 1 },
        },
      });

      return { billId: bill.id, donorId: payment.donorId };
    })
    .then(async (result) => {
      await sendPushToUser(
        result.donorId,
        "Covered ✓",
        "The poster confirmed your payment. You're on the leaderboard.",
        "/leaderboard",
      );

      return getBillById(result.billId);
    });
}

export async function flagBill(input: {
  billId: string;
  flaggedBy: string;
  reason: FlagReason;
}) {
  const bill = await prisma.bill.findUnique({ where: { id: input.billId } });

  if (!bill || bill.deletedAt) {
    throw new Error("Bill not found");
  }
  if (bill.posterId === input.flaggedBy) {
    throw new Error("You cannot flag your own bill");
  }

  await prisma.flag.create({
    data: {
      billId: input.billId,
      flaggedBy: input.flaggedBy,
      reason: input.reason,
    },
  });

  const flagCount = await prisma.flag.count({
    where: { billId: input.billId },
  });

  if (
    flagCount >= env.flagAutoThreshold &&
    bill.status !== BillStatus.flagged &&
    bill.status !== BillStatus.covered
  ) {
    await prisma.bill.update({
      where: { id: input.billId },
      data: { status: BillStatus.flagged },
    });
  }

  return { flagCount, flagged: flagCount >= env.flagAutoThreshold };
}

/** Mark open bills past their due date as expired. */
export async function expireOverdueOpenBills(now = new Date()) {
  const result = await prisma.bill.updateMany({
    where: {
      status: BillStatus.open,
      deletedAt: null,
      dueDate: { lt: now },
    },
    data: { status: BillStatus.expired },
  });

  return { expired: result.count };
}

export async function expireStaleConfirmations() {
  const cutoff = addHours(new Date(), -env.confirmationWindowHours);

  const stale = await prisma.bill.findMany({
    where: {
      status: BillStatus.pending_confirmation,
      updatedAt: { lte: cutoff },
    },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  let processed = 0;

  for (const bill of stale) {
    const reopened = await prisma.bill.updateMany({
      where: {
        id: bill.id,
        status: BillStatus.pending_confirmation,
      },
      data: {
        status: BillStatus.open,
        coveredById: null,
      },
    });

    if (reopened.count !== 1) continue;

    const donorId = bill.payments[0]?.donorId;

    if (donorId) {
      await sendPushToUser(
        donorId,
        "Confirmation timed out",
        "The poster did not confirm within 24 hours. The bill is open again.",
        `/bills/${bill.id}`,
      );
      await sendPushToUser(
        bill.posterId,
        "Confirmation missed",
        "A covering payment was not confirmed in time.",
        `/bills/${bill.id}`,
      );
    }

    // Soft-lock posters with too many unconfirmed payments
    const unconfirmed = await prisma.payment.count({
      where: {
        bill: { posterId: bill.posterId },
        posterConfirmedAt: null,
        donorMarkedAt: { lte: cutoff },
      },
    });

    if (unconfirmed >= env.postingLockThreshold) {
      await prisma.user.update({
        where: { id: bill.posterId },
        data: { postingLocked: true },
      });
    }

    processed += 1;
  }

  return { processed };
}

export { getPublicLeaderboard as getLeaderboard } from "@/lib/leaderboard";
