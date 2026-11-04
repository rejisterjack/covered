import { BillStatus } from "@prisma/client";

import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { publicName, serializeBillCard } from "@/lib/serializers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      city: true,
      isVerifiedPublic: true,
      totalGiven: true,
      billsCovered: true,
      billsPosted: true,
      createdAt: true,
    },
  });

  if (!user) {
    return jsonError("User not found", 404);
  }

  const [posted, covered, confirmedPayments, totalPayments] = await Promise.all(
    [
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
        where: {
          bill: { posterId: id },
          posterConfirmedAt: { not: null },
        },
      }),
      prisma.payment.count({
        where: { bill: { posterId: id } },
      }),
    ],
  );

  const confirmationRate =
    totalPayments === 0
      ? null
      : Math.round((confirmedPayments / totalPayments) * 100);

  return jsonOk({
    user: {
      id: user.id,
      firstName: publicName(user.name),
      image: user.image,
      city: user.city,
      isVerifiedPublic: user.isVerifiedPublic,
      totalGiven: Number(user.totalGiven),
      billsCovered: user.billsCovered,
      billsPosted: user.billsPosted,
      confirmationRate,
      createdAt: user.createdAt.toISOString(),
    },
    posted: posted.map(serializeBillCard),
    covered: covered.map(serializeBillCard),
  });
}
