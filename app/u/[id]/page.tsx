import Link from "next/link";
import { notFound } from "next/navigation";
import { BillStatus } from "@prisma/client";

import { BillCard } from "@/components/bills/bill-card";
import { formatInr } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { publicName, serializeBillCard } from "@/lib/serializers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: Params) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) notFound();

  const [posted, covered, confirmed, totalPayments] = await Promise.all([
    prisma.bill.findMany({
      where: {
        posterId: id,
        status: { not: BillStatus.flagged },
        deletedAt: null,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            city: true,
            image: true,
            isVerifiedPublic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.bill.findMany({
      where: {
        coveredById: id,
        status: BillStatus.covered,
        deletedAt: null,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            city: true,
            image: true,
            isVerifiedPublic: true,
          },
        },
        coveredBy: {
          select: {
            id: true,
            name: true,
            city: true,
            image: true,
            isVerifiedPublic: true,
          },
        },
      },
      orderBy: { coveredAt: "desc" },
      take: 20,
    }),
    prisma.payment.count({
      where: { bill: { posterId: id }, posterConfirmedAt: { not: null } },
    }),
    prisma.payment.count({ where: { bill: { posterId: id } } }),
  ]);

  const confirmationRate =
    totalPayments === 0 ? null : Math.round((confirmed / totalPayments) * 100);

  return (
    <div>
      <div className="border-b border-[#2f3336] px-4 py-5">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#16181c] text-[22px] font-bold sm:h-16 sm:w-16 sm:text-[24px]">
          {(publicName(user.name)[0] ?? "?").toUpperCase()}
        </div>
        <h1 className="text-[20px] font-extrabold tracking-tight sm:text-[22px]">
          {publicName(user.name)}
          {user.isVerifiedPublic ? " ✓" : ""}
        </h1>
        <p className="mt-1.5 text-[14px] leading-5 text-[#71767b]">
          {user.city ?? "Somewhere"} · given{" "}
          {formatInr(Number(user.totalGiven))} · {user.billsCovered} covered ·{" "}
          {user.billsPosted} posted
          {confirmationRate !== null
            ? ` · ${confirmationRate}% confirm rate`
            : ""}
        </p>
        <Link
          className="mt-3 inline-block text-[14px] font-bold text-[#1d9bf0] hover:underline"
          href="/leaderboard"
        >
          View leaderboard
        </Link>
      </div>

      <section>
        <h2 className="border-b border-[#2f3336] px-4 py-3 text-[15px] font-bold">
          Posted
        </h2>
        {posted.map((bill) => (
          <BillCard key={bill.id} bill={serializeBillCard(bill)} />
        ))}
        {posted.length === 0 ? (
          <p className="px-4 py-8 text-[14px] text-[#71767b]">
            No bills posted.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="border-b border-[#2f3336] px-4 py-3 text-[15px] font-bold">
          Covered
        </h2>
        {covered.map((bill) => (
          <BillCard key={bill.id} bill={serializeBillCard(bill)} />
        ))}
        {covered.length === 0 ? (
          <p className="px-4 py-8 text-[14px] text-[#71767b]">
            No bills covered yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
