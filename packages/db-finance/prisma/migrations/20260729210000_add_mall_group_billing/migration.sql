-- AlterTable: document-type checklist + manual VAT billing flag per branch
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "usesSummarySheet" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "usesPaymentReceipt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "usesTaxInvoice" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "usesWithholdingCert" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "credit_term_cycle_configs" ADD COLUMN "usesManualVatBilling" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "mall_group_billings" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "storefrontSalesIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliverySalesIncVat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mall_group_billings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mall_group_billings_branchId_periodStart_periodEnd_key" ON "mall_group_billings"("branchId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "mall_group_billings" ADD CONSTRAINT "mall_group_billings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
