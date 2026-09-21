-- DropIndex
DROP INDEX "acc_journal_lines_accountId_idx";

-- AlterTable
ALTER TABLE "acc_journal_lines" ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "status" "AccEntryStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "acc_journal_lines_status_date_accountId_idx" ON "acc_journal_lines"("status", "date", "accountId");

-- CreateIndex
CREATE INDEX "acc_journal_lines_accountId_status_date_idx" ON "acc_journal_lines"("accountId", "status", "date");

