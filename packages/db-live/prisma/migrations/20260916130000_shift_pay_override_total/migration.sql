-- AlterTable
ALTER TABLE "live_shifts" DROP COLUMN "payCommissionPct",
DROP COLUMN "payMinHourly",
DROP COLUMN "payShippingPct",
ADD COLUMN     "payOverride" DOUBLE PRECISION;

