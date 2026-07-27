-- AlterTable
ALTER TABLE "rent_configs" ADD COLUMN "minAmount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "cash_adjustments" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_adjustments_pkey" PRIMARY KEY ("id")
);
