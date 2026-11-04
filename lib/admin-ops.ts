import { BillStatus, Prisma } from "@prisma/client";
import { subHours } from "date-fns";

import { getPlatformSettings, writeAudit } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function getAdminMetrics() {
  const since = subHours(new Date(), 24);
  const settings = await getPlatformSettings();

  const [openBills, pendingConfirmation, flagged, lockedUsers, coversLast24h] =
    await Promise.all([
      prisma.bill.count({
        where: { status: BillStatus.open, deletedAt: null },
      }),
      prisma.bill.count({
        where: { status: BillStatus.pending_confirmation, deletedAt: null },
      }),
      prisma.bill.count({
        where: { status: BillStatus.flagged, deletedAt: null },
      }),
      prisma.user.count({ where: { postingLocked: true } }),
      prisma.bill.count({
        where: {
          status: BillStatus.covered,
          coveredAt: { gte: since },
          deletedAt: null,
        },
      }),
    ]);

  return {
    openBills,
    pendingConfirmation,
    flagged,
    lockedUsers,
    coversLast24h,
    pausePosting: settings.pausePosting,
  };
}

export async function listFlaggedBills(take = 100) {
  return prisma.bill.findMany({
    where: { status: BillStatus.flagged, deletedAt: null },
    include: {
      poster: { select: { id: true, name: true, email: true } },
      flags: {
        select: { id: true, reason: true, flaggedBy: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function listPendingConfirmations(take = 100) {
  return prisma.bill.findMany({
    where: { status: BillStatus.pending_confirmation, deletedAt: null },
    include: {
      poster: { select: { id: true, name: true, email: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          donor: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    take,
  });
}

export async function reopenBill(billId: string, actorId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });

  if (!bill) throw new Error("Bill not found");

  await prisma.$transaction(async (tx) => {
    await tx.flag.deleteMany({ where: { billId } });
    await tx.bill.update({
      where: { id: billId },
      data: {
        status: BillStatus.open,
        deletedAt: null,
        coveredById: null,
      },
    });
  });

  await writeAudit({
    actorId,
    action: "bill.reopen",
    targetType: "bill",
    targetId: billId,
  });

  return prisma.bill.findUniqueOrThrow({ where: { id: billId } });
}

export async function softDeleteBill(billId: string, actorId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });

  if (!bill) throw new Error("Bill not found");
  if (bill.deletedAt) throw new Error("Bill already deleted");

  const updated = await prisma.bill.update({
    where: { id: billId },
    data: {
      deletedAt: new Date(),
      status: BillStatus.flagged,
    },
  });

  await writeAudit({
    actorId,
    action: "bill.soft_delete",
    targetType: "bill",
    targetId: billId,
  });

  return updated;
}

export async function restoreBill(billId: string, actorId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { poster: { select: { postingLocked: true } } },
  });

  if (!bill) throw new Error("Bill not found");
  if (!bill.deletedAt) throw new Error("Bill is not deleted");
  if (bill.poster.postingLocked) {
    throw new Error("Cannot restore: poster posting is locked");
  }

  const updated = await prisma.bill.update({
    where: { id: billId },
    data: {
      deletedAt: null,
      status: BillStatus.open,
      coveredById: null,
    },
  });

  await writeAudit({
    actorId,
    action: "bill.restore",
    targetType: "bill",
    targetId: billId,
  });

  return updated;
}

export async function forceReopenBill(billId: string, actorId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });

  if (!bill) throw new Error("Bill not found");
  if (bill.status !== BillStatus.pending_confirmation) {
    throw new Error("Bill is not pending confirmation");
  }

  const updated = await prisma.bill.update({
    where: { id: billId },
    data: {
      status: BillStatus.open,
      coveredById: null,
    },
  });

  await writeAudit({
    actorId,
    action: "bill.force_reopen",
    targetType: "bill",
    targetId: billId,
  });

  return updated;
}

export async function searchUsers(q: string, take = 50) {
  const term = q.trim();

  if (!term) return [];

  return prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: term, mode: "insensitive" } },
        { name: { contains: term, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      postingLocked: true,
      isVerifiedPublic: true,
      billsPosted: true,
      billsCovered: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function searchBills(q: string, take = 50) {
  const term = q.trim();

  if (!term) return [];

  return prisma.bill.findMany({
    where: {
      OR: [{ id: term }, { story: { contains: term, mode: "insensitive" } }],
    },
    include: {
      poster: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function setUserPostingLocked(
  userId: string,
  locked: boolean,
  actorId: string,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { postingLocked: locked },
  });

  await writeAudit({
    actorId,
    action: locked ? "user.lock" : "user.unlock",
    targetType: "user",
    targetId: userId,
  });

  return user;
}

export async function toggleUserVerified(userId: string, actorId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });

  if (!existing) throw new Error("User not found");

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isVerifiedPublic: !existing.isVerifiedPublic },
  });

  await writeAudit({
    actorId,
    action: "user.verify_toggle",
    targetType: "user",
    targetId: userId,
    meta: { isVerifiedPublic: user.isVerifiedPublic },
  });

  return user;
}

export async function updatePausePosting(
  pausePosting: boolean,
  actorId: string,
) {
  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      pausePosting,
      updatedById: actorId,
    },
    update: {
      pausePosting,
      updatedById: actorId,
    },
  });

  await writeAudit({
    actorId,
    action: "settings.pause_posting",
    targetType: "platform",
    targetId: "default",
    meta: { pausePosting },
  });

  return settings;
}

export async function listAuditLogs(take = 100) {
  return prisma.adminAuditLog.findMany({
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Pure helpers for unit tests */
export function publicBillVisibilityWhere(): Prisma.BillWhereInput {
  return {
    deletedAt: null,
    status: { not: BillStatus.flagged },
  };
}

export function shouldRejectPostingWhenPaused(pausePosting: boolean) {
  return pausePosting;
}
