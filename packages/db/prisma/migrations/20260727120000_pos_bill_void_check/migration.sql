-- AlterEnum
ALTER TYPE "ScanResult" ADD VALUE 'BILL_VOIDED';
ALTER TYPE "ScanResult" ADD VALUE 'BILL_NOT_FOUND';

-- AlterTable
ALTER TABLE "point_transactions" ADD COLUMN "voidedInPos" BOOLEAN NOT NULL DEFAULT false;
