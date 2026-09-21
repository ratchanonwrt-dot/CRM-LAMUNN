-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "VatRole" AS ENUM ('OUTPUT', 'INPUT', 'WHT');

-- CreateEnum
CREATE TYPE "AccPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'VOID');

-- CreateEnum
CREATE TYPE "AccJournalType" AS ENUM ('GENERAL', 'SALES', 'PURCHASE', 'RECEIPT', 'PAYMENT', 'ADJUST', 'CLOSING');

-- AlterEnum
ALTER TYPE "PermissionSection" ADD VALUE 'ACCOUNTING';

-- CreateTable
CREATE TABLE "acc_accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentCode" TEXT,
    "isPostable" BOOLEAN NOT NULL DEFAULT true,
    "vatRole" "VatRole",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_periods" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "AccPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,

    CONSTRAINT "acc_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_journal_entries" (
    "id" TEXT NOT NULL,
    "entryNo" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "journalType" "AccJournalType" NOT NULL DEFAULT 'GENERAL',
    "status" "AccEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceKey" TEXT,
    "createdBy" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_journal_lines" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "branchId" TEXT,
    "channel" TEXT,
    "memo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "acc_journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acc_tax_invoices" (
    "id" TEXT NOT NULL,
    "docNo" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "saleDate" DATE NOT NULL,
    "branchId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'STOREFRONT',
    "receiptNo" TEXT,
    "customerName" TEXT NOT NULL,
    "taxId" TEXT,
    "branchTag" TEXT,
    "address" TEXT,
    "description" TEXT NOT NULL DEFAULT 'อาหารและเครื่องดื่ม',
    "baseAmount" DECIMAL(15,2) NOT NULL,
    "vatAmount" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "deductFromBulk" BOOLEAN NOT NULL DEFAULT true,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acc_tax_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acc_accounts_code_key" ON "acc_accounts"("code");

-- CreateIndex
CREATE INDEX "acc_accounts_type_idx" ON "acc_accounts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "acc_periods_year_month_key" ON "acc_periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "acc_journal_entries_entryNo_key" ON "acc_journal_entries"("entryNo");

-- CreateIndex
CREATE INDEX "acc_journal_entries_date_idx" ON "acc_journal_entries"("date");

-- CreateIndex
CREATE INDEX "acc_journal_entries_status_idx" ON "acc_journal_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "acc_journal_entries_sourceType_sourceKey_key" ON "acc_journal_entries"("sourceType", "sourceKey");

-- CreateIndex
CREATE INDEX "acc_journal_lines_entryId_idx" ON "acc_journal_lines"("entryId");

-- CreateIndex
CREATE INDEX "acc_journal_lines_accountId_idx" ON "acc_journal_lines"("accountId");

-- CreateIndex
CREATE INDEX "acc_journal_lines_branchId_idx" ON "acc_journal_lines"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "acc_tax_invoices_docNo_key" ON "acc_tax_invoices"("docNo");

-- CreateIndex
CREATE INDEX "acc_tax_invoices_saleDate_idx" ON "acc_tax_invoices"("saleDate");

-- CreateIndex
CREATE INDEX "acc_tax_invoices_issueDate_idx" ON "acc_tax_invoices"("issueDate");

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "acc_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "acc_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_journal_lines" ADD CONSTRAINT "acc_journal_lines_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acc_tax_invoices" ADD CONSTRAINT "acc_tax_invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

