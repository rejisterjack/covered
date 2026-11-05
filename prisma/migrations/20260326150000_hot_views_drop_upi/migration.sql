-- Payee handles live on the bill. Drop the standing profile UPI.
ALTER TABLE "User" DROP COLUMN "upiId";

-- Views counted per UTC day so Hot can rank today's activity.
CREATE TABLE "BillViewDay" (
    "billId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BillViewDay_pkey" PRIMARY KEY ("billId","day")
);

CREATE INDEX "BillViewDay_day_idx" ON "BillViewDay"("day");

ALTER TABLE "BillViewDay" ADD CONSTRAINT "BillViewDay_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
