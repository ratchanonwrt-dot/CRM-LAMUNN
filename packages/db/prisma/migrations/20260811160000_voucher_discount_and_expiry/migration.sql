-- AlterTable
ALTER TABLE "rewards" ADD COLUMN "discountPercent" INTEGER,
ADD COLUMN "discountMaxAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "redemptions" ADD COLUMN "expiresAt" TIMESTAMP(3);
