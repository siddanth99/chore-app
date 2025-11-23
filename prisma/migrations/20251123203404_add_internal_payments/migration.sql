-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('CUSTOMER_TO_OWNER', 'OWNER_TO_WORKER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "ChorePaymentStatus" AS ENUM ('NONE', 'CUSTOMER_PARTIAL', 'CUSTOMER_PAID', 'SETTLED');

-- AlterTable
ALTER TABLE "chores" ADD COLUMN     "agreedPrice" INTEGER,
ADD COLUMN     "paymentStatus" "ChorePaymentStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "choreId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_choreId_fkey" FOREIGN KEY ("choreId") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
