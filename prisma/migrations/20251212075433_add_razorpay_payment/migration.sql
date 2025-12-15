-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "razorpay_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choreId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_payments_razorpayOrderId_key" ON "razorpay_payments"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "razorpay_payments_userId_idx" ON "razorpay_payments"("userId");

-- CreateIndex
CREATE INDEX "razorpay_payments_choreId_idx" ON "razorpay_payments"("choreId");

-- CreateIndex
CREATE INDEX "razorpay_payments_status_idx" ON "razorpay_payments"("status");

-- AddForeignKey
ALTER TABLE "razorpay_payments" ADD CONSTRAINT "razorpay_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "razorpay_payments" ADD CONSTRAINT "razorpay_payments_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
