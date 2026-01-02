-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "worker_payouts" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "razorpayPayoutId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worker_payouts_choreId_idx" ON "worker_payouts"("choreId");

-- CreateIndex
CREATE INDEX "worker_payouts_workerId_idx" ON "worker_payouts"("workerId");

-- CreateIndex
CREATE INDEX "worker_payouts_status_idx" ON "worker_payouts"("status");

-- AddForeignKey
ALTER TABLE "worker_payouts" ADD CONSTRAINT "worker_payouts_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_payouts" ADD CONSTRAINT "worker_payouts_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
