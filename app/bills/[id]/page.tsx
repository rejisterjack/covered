import { notFound } from "next/navigation";

import { BillDetailClient } from "@/components/bills/bill-detail-client";
import { getBillById, incrementBillViews } from "@/lib/bills";
import { prisma } from "@/lib/prisma";
import { serializeBillDetail } from "@/lib/serializers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function BillDetailPage({ params }: Params) {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) notFound();

  await incrementBillViews(id);
  const session = await getSession();
  const viewerId = session?.user.id ?? null;

  let includePayment = false;

  if (viewerId) {
    if (viewerId === bill.posterId) {
      includePayment = true;
    } else {
      const intent = await prisma.coverIntent.findUnique({
        where: { billId_userId: { billId: id, userId: viewerId } },
      });

      includePayment = Boolean(intent) || bill.coveredById === viewerId;
    }
  }

  const serialized = serializeBillDetail(bill, {
    includePayment,
    viewerId,
  });

  return (
    <BillDetailClient
      initialBill={serialized}
      initialPaymentMeta={
        bill.payments[0]
          ? {
              donorMarkedAt: bill.payments[0].donorMarkedAt.toISOString(),
              posterConfirmedAt:
                bill.payments[0].posterConfirmedAt?.toISOString() ?? null,
            }
          : null
      }
      signedIn={Boolean(session?.user)}
    />
  );
}
