-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "billerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Bill" ADD COLUMN "referenceNo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Bill" ADD COLUMN "dueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing story stays; empty allowed going forward
ALTER TABLE "Bill" ALTER COLUMN "story" SET DEFAULT '';

-- Drop defaults after backfill so new rows must supply values
ALTER TABLE "Bill" ALTER COLUMN "billerName" DROP DEFAULT;
ALTER TABLE "Bill" ALTER COLUMN "referenceNo" DROP DEFAULT;
ALTER TABLE "Bill" ALTER COLUMN "dueDate" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Bill_billerName_referenceNo_status_idx" ON "Bill"("billerName", "referenceNo", "status");
