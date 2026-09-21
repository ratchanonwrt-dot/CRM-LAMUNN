-- Replace per-branch document-type flags with a shared "billing group" (The Mall Group / Central / Tops)
CREATE TABLE "billing_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "usesSummarySheet" BOOLEAN NOT NULL DEFAULT false,
    "usesPaymentReceipt" BOOLEAN NOT NULL DEFAULT false,
    "usesTaxInvoice" BOOLEAN NOT NULL DEFAULT false,
    "usesWithholdingCert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "billing_groups_name_key" ON "billing_groups"("name");

ALTER TABLE "credit_term_cycle_configs" DROP COLUMN "usesSummarySheet";
ALTER TABLE "credit_term_cycle_configs" DROP COLUMN "usesPaymentReceipt";
ALTER TABLE "credit_term_cycle_configs" DROP COLUMN "usesTaxInvoice";
ALTER TABLE "credit_term_cycle_configs" DROP COLUMN "usesWithholdingCert";
ALTER TABLE "credit_term_cycle_configs" DROP COLUMN "usesManualVatBilling";
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "billingGroupId" TEXT;
ALTER TABLE "credit_term_cycle_configs" ADD CONSTRAINT "credit_term_cycle_configs_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "billing_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename mall_group_billings -> branch_billings (now general-purpose, not Mall-Group-specific) and add billingDate
ALTER TABLE "mall_group_billings" RENAME TO "branch_billings";
ALTER TABLE "branch_billings" RENAME CONSTRAINT "mall_group_billings_pkey" TO "branch_billings_pkey";
ALTER TABLE "branch_billings" RENAME CONSTRAINT "mall_group_billings_branchId_fkey" TO "branch_billings_branchId_fkey";
ALTER INDEX "mall_group_billings_branchId_periodStart_periodEnd_key" RENAME TO "branch_billings_branchId_periodStart_periodEnd_key";
ALTER TABLE "branch_billings" ADD COLUMN "billingDate" DATE;
