ALTER TABLE "acc_wht_certificates"
ADD COLUMN "purchaseInvoiceId" TEXT;

CREATE UNIQUE INDEX "acc_wht_certificates_purchaseInvoiceId_key"
ON "acc_wht_certificates"("purchaseInvoiceId");

ALTER TABLE "acc_wht_certificates"
ADD CONSTRAINT "acc_wht_certificates_purchaseInvoiceId_fkey"
FOREIGN KEY ("purchaseInvoiceId") REFERENCES "acc_purchase_tax_invoices"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
