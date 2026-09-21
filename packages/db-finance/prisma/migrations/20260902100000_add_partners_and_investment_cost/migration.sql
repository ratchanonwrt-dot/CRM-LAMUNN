-- AlterEnum
ALTER TYPE "PermissionSection" ADD VALUE 'INVESTMENT_COST';

-- CreateEnum
CREATE TYPE "AccPartnerType" AS ENUM ('DEBTOR', 'CREDITOR');

-- CreateTable
CREATE TABLE "acc_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccPartnerType" NOT NULL,
    "phone" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acc_partners_type_idx" ON "acc_partners"("type");

-- AlterTable
ALTER TABLE "acc_journal_lines" ADD COLUMN "partnerId" TEXT;

-- CreateIndex
CREATE INDEX "acc_journal_lines_partnerId_idx" ON "acc_journal_lines"("partnerId");

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "acc_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "investment_costs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "investment_costs_date_idx" ON "investment_costs"("date");
