import { getBillById, incrementBillViews } from "@/lib/bills";
import { jsonError, jsonOk } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { serializeBillDetail } from "@/lib/serializers";
import { requireUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return jsonError("Bill not found", 404);
  }

  await incrementBillViews(id);

  const session = await requireUser(request);
  const viewerId = session?.user.id ?? null;

  let includePayment = false;

  if (viewerId) {
    if (viewerId === bill.posterId) {
      includePayment = true;
    } else {
      const intent = await prisma.coverIntent.findUnique({
        where: {
          billId_userId: { billId: id, userId: viewerId },
        },
      });

      includePayment = Boolean(intent) || bill.coveredById === viewerId;
    }
  }

  return jsonOk({
    bill: serializeBillDetail(bill, {
      includePayment,
      viewerId,
    }),
    payment: bill.payments[0]
      ? {
          id: bill.payments[0].id,
          donorMarkedAt: bill.payments[0].donorMarkedAt.toISOString(),
          posterConfirmedAt:
            bill.payments[0].posterConfirmedAt?.toISOString() ?? null,
          isAnonymous: bill.payments[0].isAnonymous,
        }
      : null,
  });
}
