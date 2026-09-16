-- AlterTable
ALTER TABLE "live_shifts" ADD COLUMN     "payCommissionPct" DOUBLE PRECISION,
ADD COLUMN     "payMinHourly" DOUBLE PRECISION,
ADD COLUMN     "payNote" TEXT,
ADD COLUMN     "payShippingPct" DOUBLE PRECISION;

