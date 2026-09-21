-- AlterTable: เลขที่ใบกำกับ/เอกสารอ้างอิงต่อบรรทัดใบสำคัญ (รายงานภาษีซื้อใช้เลขนี้แทนเลขที่ใบสำคัญ)
ALTER TABLE "acc_journal_lines" ADD COLUMN IF NOT EXISTS "docNo" TEXT;
