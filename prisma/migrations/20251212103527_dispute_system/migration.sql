/*
  Warnings:

  - The values [NONE,CUSTOMER_PARTIAL,CUSTOMER_PAID,SETTLED] on the enum `ChorePaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED_REFUND_CLIENT', 'RESOLVED_PAY_WORKER', 'RESOLVED_MANUAL', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "ChorePaymentStatus_new" AS ENUM ('UNPAID', 'PENDING', 'FUNDED', 'REFUNDED');
ALTER TABLE "chores" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "chores" ALTER COLUMN "paymentStatus" TYPE "ChorePaymentStatus_new" USING ("paymentStatus"::text::"ChorePaymentStatus_new");
ALTER TYPE "ChorePaymentStatus" RENAME TO "ChorePaymentStatus_old";
ALTER TYPE "ChorePaymentStatus_new" RENAME TO "ChorePaymentStatus";
DROP TYPE "ChorePaymentStatus_old";
ALTER TABLE "chores" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID';
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ChoreStatus" ADD VALUE 'OPEN';
ALTER TYPE "ChoreStatus" ADD VALUE 'FUNDED';
ALTER TYPE "ChoreStatus" ADD VALUE 'CLIENT_REVIEW';
ALTER TYPE "ChoreStatus" ADD VALUE 'CLOSED';
ALTER TYPE "ChoreStatus" ADD VALUE 'CANCELED';

-- AlterTable
ALTER TABLE "chores" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
-- ALTER COLUMN "status" SET DEFAULT 'OPEN',
ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "razorpay_payments" ADD COLUMN     "platformFee" INTEGER,
ADD COLUMN     "transferId" TEXT,
ADD COLUMN     "workerPayout" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "payoutOnboardingAt" TIMESTAMP(3),
ADD COLUMN     "razorpayAccountId" TEXT,
ADD COLUMN     "upiId" TEXT;

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "amountRefunded" INTEGER,
    "workerPayoutAdjustment" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disputes_choreId_idx" ON "disputes"("choreId");

-- CreateIndex
CREATE INDEX "disputes_userId_idx" ON "disputes"("userId");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
