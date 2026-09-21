-- CreateEnum
CREATE TYPE "AccWhtFormType" AS ENUM ('PND3', 'PND53');

-- CreateTable
CREATE TABLE "acc_purchase_tax_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "partnerId" TEXT,
    "vendorName" TEXT NOT NULL,
    "vendorTaxId" TEXT,
    "vendorBranchTag" TEXT,
    "description" TEXT NOT NULL DEFAULT 'ค่าสินค้า/บริการ',
    "baseAmount" DECIMAL(15,2) NOT NULL,
    "vatAmount" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "isClaimable" BOOLEAN NOT NULL DEFAULT true,
    "entryId" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_purchase_tax_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_wht_certificates" (
    "id" TEXT NOT NULL,
    "docNo" TEXT NOT NULL,
    "payDate" DATE NOT NULL,
    "formType" "AccWhtFormType" NOT NULL,
    "partnerId" TEXT,
    "payeeName" TEXT NOT NULL,
    "payeeTaxId" TEXT,
    "payeeAddress" TEXT,
    "payeeBranchTag" TEXT,
    "incomeType" TEXT NOT NULL,
    "baseAmount" DECIMAL(15,2) NOT NULL,
    "whtRate" DOUBLE PRECISION NOT NULL,
    "whtAmount" DECIMAL(15,2) NOT NULL,
    "entryId" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_wht_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acc_purchase_tax_invoices_invoiceDate_idx" ON "acc_purchase_tax_invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "acc_purchase_tax_invoices_partnerId_idx" ON "acc_purchase_tax_invoices"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "acc_wht_certificates_docNo_key" ON "acc_wht_certificates"("docNo");

-- CreateIndex
CREATE INDEX "acc_wht_certificates_payDate_idx" ON "acc_wht_certificates"("payDate");

-- CreateIndex
CREATE INDEX "acc_wht_certificates_formType_payDate_idx" ON "acc_wht_certificates"("formType", "payDate");

-- CreateIndex
CREATE INDEX "acc_wht_certificates_partnerId_idx" ON "acc_wht_certificates"("partnerId");

-- AddForeignKey
ALTER TABLE "acc_purchase_tax_invoices" ADD CONSTRAINT "acc_purchase_tax_invoices_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "acc_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_wht_certificates" ADD CONSTRAINT "acc_wht_certificates_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "acc_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

