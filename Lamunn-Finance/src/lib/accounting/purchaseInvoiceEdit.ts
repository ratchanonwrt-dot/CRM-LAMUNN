import { prisma } from "@lamunn/db-finance";
import { parseDateOnly } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { splitVatInclusive, addVatExclusive, toBaht, toSatang } from "./money";
import { AccountingError, updateEntry } from "./post";

/** แก้ไขใบกำกับภาษีซื้อที่บันทึกไปแล้ว — ใช้กรณีคีย์เลขที่ใบกำกับ/ชื่อ/ยอดผิด
 *
 * กฎ:
 *  - ใบที่ยกเลิกแล้วแก้ไม่ได้
 *  - เลขที่ใบกำกับ + ผู้ขาย ต้องไม่ซ้ำกับใบอื่นที่ยังใช้อยู่ (กฎเดียวกับตอนบันทึกใหม่)
 *  - ถ้าใบนี้ผูกใบสำคัญไว้: แก้ยอด/วันที่ได้เฉพาะตอนใบสำคัญยังเป็นร่าง (เขียนบรรทัดใหม่ให้ตรงยอด)
 *    ใบสำคัญที่ผ่านรายการแล้วต้องไปกด "ยกเลิกผ่านรายการ" ในสมุดรายวันก่อน — กันงบเพี้ยนเงียบๆ
 *  - แก้เลขที่ใบกำกับ/ชื่อผู้ขาย จะอัปเดตคำอธิบายใบสำคัญให้ด้วย เฉพาะเมื่อคำอธิบายยังเป็นข้อความ
 *    ที่ระบบสร้างให้ตอนแรก (ถ้าบัญชีไปแก้คำอธิบายเองแล้ว จะไม่ทับ)
 */
export interface PurchaseInvoicePatch {
  invoiceNo?: string;
  invoiceDate?: string; // yyyy-mm-dd
  vendorName?: string;
  vendorTaxId?: string | null;
  vendorBranchTag?: string | null;
  description?: string;
  note?: string | null;
  isClaimable?: boolean;
  /** ส่งมาเฉพาะตอนต้องการเปลี่ยนยอด — ระบบจะแยก ฐาน/VAT ใหม่ตามอัตราในตั้งค่า */
  amount?: string | number;
  amountIncludesVat?: boolean;
}

export const entryDescriptionFor = (vendorName: string, invoiceNo: string) => `ซื้อ ${vendorName} ใบกำกับ ${invoiceNo}`;

const str = (v: unknown) => String(v ?? "").trim();

/** opts.vatRate — ส่งมาได้จากสคริปต์ทดสอบ (getAllSettings ใช้แคชของ Next ซึ่งไม่มีนอกเซิร์ฟเวอร์) */
export async function updatePurchaseInvoice(id: string, patch: PurchaseInvoicePatch, opts: { vatRate?: number } = {}) {
  const current = await prisma.accPurchaseTaxInvoice.findUnique({ where: { id } });
  if (!current) throw new AccountingError("ไม่พบใบกำกับภาษีซื้อนี้");
  if (current.voided) throw new AccountingError("ใบกำกับนี้ถูกยกเลิกไปแล้ว แก้ไขไม่ได้ — บันทึกใบใหม่แทน");

  const invoiceNo = patch.invoiceNo !== undefined ? str(patch.invoiceNo) : current.invoiceNo;
  const vendorName = patch.vendorName !== undefined ? str(patch.vendorName) : current.vendorName;
  const vendorTaxId = patch.vendorTaxId !== undefined ? str(patch.vendorTaxId) || null : current.vendorTaxId;
  const vendorBranchTag = patch.vendorBranchTag !== undefined ? str(patch.vendorBranchTag) || null : current.vendorBranchTag;
  const description = patch.description !== undefined ? str(patch.description) || "ค่าสินค้า/บริการ" : current.description;
  const note = patch.note !== undefined ? str(patch.note) || null : current.note;
  const isClaimable = patch.isClaimable !== undefined ? patch.isClaimable !== false : current.isClaimable;
  const invoiceDate = patch.invoiceDate ? parseDateOnly(patch.invoiceDate) : current.invoiceDate;

  if (!invoiceNo || !vendorName) throw new AccountingError("เลขที่ใบกำกับและชื่อผู้ขายเว้นว่างไม่ได้");

  let base = toSatang(current.baseAmount);
  let vat = toSatang(current.vatAmount);
  if (patch.amount !== undefined && str(patch.amount) !== "") {
    const amountSatang = toSatang(patch.amount);
    if (amountSatang <= 0) throw new AccountingError("ยอดเงินต้องมากกว่า 0");
    const vatRate = opts.vatRate ?? Number((await getAllSettings()).vatRate);
    ({ base, vat } = patch.amountIncludesVat === false ? addVatExclusive(amountSatang, vatRate) : splitVatInclusive(amountSatang, vatRate));
  }

  const amountChanged = base !== toSatang(current.baseAmount) || vat !== toSatang(current.vatAmount);
  const dateChanged = invoiceDate.getTime() !== current.invoiceDate.getTime();
  const identityChanged = invoiceNo !== current.invoiceNo || vendorName !== current.vendorName || vendorTaxId !== current.vendorTaxId;

  if (identityChanged) {
    const duplicate = await prisma.accPurchaseTaxInvoice.findFirst({
      where: {
        id: { not: id },
        invoiceNo,
        voided: false,
        ...(vendorTaxId ? { vendorTaxId } : { vendorName }),
      },
      select: { invoiceDate: true },
    });
    if (duplicate) {
      throw new AccountingError(
        `ใบกำกับเลขที่ ${invoiceNo} ของผู้ขายรายนี้มีอยู่แล้ว (วันที่ ${duplicate.invoiceDate.toISOString().slice(0, 10)})`
      );
    }
  }

  // ---- ใบสำคัญที่ผูกไว้ ----
  const entry = current.entryId
    ? await prisma.accJournalEntry.findUnique({
        where: { id: current.entryId },
        include: { lines: { orderBy: { sortOrder: "asc" }, include: { account: { select: { vatRole: true } } } } },
      })
    : null;

  if (entry && entry.status !== "VOID") {
    if (amountChanged || dateChanged) {
      if (entry.status === "POSTED") {
        throw new AccountingError(
          `ใบสำคัญ ${entry.entryNo} ผ่านรายการแล้ว — ไปกด "ยกเลิกผ่านรายการ" ในสมุดรายวันก่อน จึงจะแก้ยอดเงินหรือวันที่ของใบกำกับนี้ได้`
        );
      }
      const vatLine = entry.lines.find((l) => l.account.vatRole === "INPUT");
      const creditLine = entry.lines.find((l) => toSatang(l.credit) > 0);
      const expenseLine = entry.lines.find((l) => l !== vatLine && toSatang(l.debit) > 0);
      if (entry.lines.length !== 3 || !vatLine || !creditLine || !expenseLine) {
        throw new AccountingError(
          `ใบสำคัญ ${entry.entryNo} ถูกแก้ไขจนไม่ใช่รูปแบบมาตรฐาน (ค่าใช้จ่าย/ภาษีซื้อ/เครดิต) — แก้ยอดที่ใบสำคัญโดยตรงแทน`
        );
      }
      const keepOrNew = entry.description === entryDescriptionFor(current.vendorName, current.invoiceNo)
        ? entryDescriptionFor(vendorName, invoiceNo)
        : entry.description;
      await updateEntry(entry.id, {
        date: invoiceDate,
        journalType: entry.journalType,
        description: keepOrNew,
        lines: [
          { accountId: expenseLine.accountId, debit: toBaht(base), partnerId: expenseLine.partnerId, branchId: expenseLine.branchId, memo: expenseLine.memo, docNo: expenseLine.docNo },
          { accountId: vatLine.accountId, debit: toBaht(vat), partnerId: vatLine.partnerId, branchId: vatLine.branchId, memo: vatLine.memo, docNo: vatLine.docNo },
          { accountId: creditLine.accountId, credit: toBaht(base + vat), partnerId: creditLine.partnerId, branchId: creditLine.branchId, memo: creditLine.memo, docNo: creditLine.docNo },
        ],
      });
    } else if (identityChanged && entry.description === entryDescriptionFor(current.vendorName, current.invoiceNo)) {
      await prisma.accJournalEntry.update({ where: { id: entry.id }, data: { description: entryDescriptionFor(vendorName, invoiceNo) } });
    }
  }

  return prisma.accPurchaseTaxInvoice.update({
    where: { id },
    data: {
      invoiceNo,
      invoiceDate,
      vendorName,
      vendorTaxId,
      vendorBranchTag,
      description,
      note,
      isClaimable,
      baseAmount: toBaht(base),
      vatAmount: toBaht(vat),
      totalAmount: toBaht(base + vat),
    },
  });
}
