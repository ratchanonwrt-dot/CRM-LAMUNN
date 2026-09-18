-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('APPROVED', 'PAID');

-- AlterTable
ALTER TABLE "streamers" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankName" TEXT;

-- CreateTable
CREATE TABLE "daily_payouts" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "streamerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "sales" DOUBLE PRECISION NOT NULL,
    "shiftCount" INTEGER NOT NULL DEFAULT 0,
    "payeeName" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "note" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedByStaffId" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "paidRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_payouts_date_streamerId_key" ON "daily_payouts"("date", "streamerId");

-- AddForeignKey
ALTER TABLE "daily_payouts" ADD CONSTRAINT "daily_payouts_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "streamers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_payouts" ADD CONSTRAINT "daily_payouts_approvedByStaffId_fkey" FOREIGN KEY ("approvedByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

