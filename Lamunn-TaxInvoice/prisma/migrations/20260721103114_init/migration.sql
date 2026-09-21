-- CreateTable
CREATE TABLE "tax_invoice_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrRawPayload" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "saleTimestamp" DATETIME NOT NULL,
    "signed" BOOLEAN NOT NULL,
    "customerType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "branchTag" TEXT,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "flowAccountDocId" TEXT,
    "flowAccountPdfUrl" TEXT,
    "emailSentAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "tax_invoice_requests_status_idx" ON "tax_invoice_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tax_invoice_requests_branchCode_receiptNo_key" ON "tax_invoice_requests"("branchCode", "receiptNo");
