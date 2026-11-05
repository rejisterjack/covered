-- AlterTable
ALTER TABLE "User" ADD COLUMN "verificationRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Bill" ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
