import { startOfMonth } from "date-fns";

import { prisma } from "@/lib/prisma";
import { buildLeaderboard, currentStreak, dayKey } from "@/lib/rank";

export async function getPublicLeaderboard(period: "all" | "month") {
  const monthStart = startOfMonth(new Date());
  const payments = await prisma.payment.findMany({
    where: {
      posterConfirmedAt:
        period === "month" ? { gte: monthStart } : { not: null },
    },
    select: {
      donorId: true,
      amount: true,
      isAnonymous: true,
      posterConfirmedAt: true,
      bill: { select: { category: true } },
    },
  });

  const donorIds = Array.from(
    new Set(payments.map((payment) => payment.donorId)),
  );
  const donors = donorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: donorIds } },
        select: {
          id: true,
          name: true,
          city: true,
          image: true,
          isVerifiedPublic: true,
          isAnonymousDefault: true,
        },
      })
    : [];

  const dayRows =
    donorIds.length === 0
      ? []
      : await prisma.payment.findMany({
          where: {
            donorId: { in: donorIds },
            posterConfirmedAt: { not: null },
          },
          select: { donorId: true, posterConfirmedAt: true },
        });

  const extraDays = new Map<string, string[]>();

  for (const row of dayRows) {
    if (!row.posterConfirmedAt) continue;
    const list = extraDays.get(row.donorId) ?? [];

    list.push(row.posterConfirmedAt.toISOString());
    extraDays.set(row.donorId, list);
  }

  const built = buildLeaderboard({
    payments: [
      ...payments
        .filter((payment) => payment.posterConfirmedAt)
        .map((payment) => ({
          donorId: payment.donorId,
          amount: Number(payment.amount),
          isAnonymous: payment.isAnonymous,
          confirmedAt: payment.posterConfirmedAt!.toISOString(),
          category: payment.bill.category,
        })),
      // Streak uses every confirmed day, including outside the month window.
      ...Array.from(extraDays.entries()).flatMap(([donorId, days]) =>
        period === "month"
          ? days.map((confirmedAt: string) => ({
              donorId,
              amount: 0,
              isAnonymous: false,
              confirmedAt,
              category: "other",
            }))
          : [],
      ),
    ],
    donors,
  });

  if (period === "month") {
    const streaks = new Map<string, number>();

    for (const [donorId, days] of Array.from(extraDays.entries())) {
      streaks.set(
        donorId,
        currentStreak(days.map((iso: string) => dayKey(new Date(iso)))),
      );
    }

    built.entries = built.entries
      .filter((entry) => entry.totalGiven > 0)
      .map((entry) => {
        const streak = streaks.get(entry.donorId) ?? entry.streak;

        return {
          ...entry,
          streak,
          badge:
            streak >= 30 ? 30 : streak >= 14 ? 14 : streak >= 7 ? 7 : null,
        };
      });
  }

  return built;
}

export async function getDonorStreak(donorId: string) {
  const rows = await prisma.payment.findMany({
    where: { donorId, posterConfirmedAt: { not: null } },
    select: { posterConfirmedAt: true },
  });
  const streak = currentStreak(
    rows
      .map((row) => row.posterConfirmedAt)
      .filter((date): date is Date => Boolean(date))
      .map((date) => dayKey(date)),
  );

  const badge: 7 | 14 | 30 | null =
    streak >= 30 ? 30 : streak >= 14 ? 14 : streak >= 7 ? 7 : null;

  return { streak, badge };
}
