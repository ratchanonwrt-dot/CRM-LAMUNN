import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { splitVatInclusive, addVatExclusive, toBaht, toSatang } from "@/lib/accounting/money";
import { createEntry, AccountingError } from "@/lib/accounting/post";
import { SYSTEM_ACCOUNTS } from "@/lib/accounting/chartOfAccounts";

/** บันทึกใบกำกับภาษีซื้อ (ใบที่ผู้ขายออกให้เรา) — ตัวป้อนข้อมูลของรายงานภาษีซื้อและ ภ.พ.30
 * เลขที่ใบกำกับมาจากผู้ขาย ไม่ได้รันเอง จึงรับค่าจากผู้กรอกโดยตรง */
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    invoiceNo,
    invoiceDate,
    partnerId,
    vendorName,
    vendorTaxId,
    vendorBranchTag,
    description,
    amount,
    amountIncludesVat,
    isClaimable,
    note,
    expenseAccountId,
    creditAccountId,
  } = body;

  if (!invoiceNo || !invoiceDate || !vendorName || !amount) {
    return NextResponse.json({ error: "กรอกเลขที่ใบกำกับ วันที่ ชื่อผู้ขาย และยอดเงินให้ครบ" }, { status: 400 });
  }

  const amountSatang = toSatang(amount);
  if (amountSatang <= 0) return NextResponse.json({ error: "ยอดเงินต้องมากกว่า 0" }, { status: 400 });

  const settings = await getAllSettings();
  const vatRate = Number(settings.vatRate);
  const { base, vat } =
    amountIncludesVat === false ? addVatExclusive(amountSatang, vatRate) : splitVatInclusive(amountSatang, vatRate);

  // กันบันทึกใบเดิมซ้ำ — ผู้ขายรายเดียวกันออกเลขที่ใบกำกับซ้ำไม่ได้
  const duplicate = await prisma.accPurchaseTaxInvoice.findFirst({
    where: {
      invoiceNo: String(invoiceNo).trim(),
      voided: false,
      ...(vendorTaxId ? { vendorTaxId: String(vendorTaxId).trim() } : { vendorName: String(vendorName).trim() }),
    },
    select: { id: true, invoiceDate: true },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: `ใบกำกับเลขที่ ${invoiceNo} ของผู้ขายรายนี้ถูกบันทึกไว้แล้ว (วันที่ ${duplicate.invoiceDate.toISOString().slice(0, 10)})` },
      { status: 400 }
    );
  }

  // ลงบัญชีให้เลยถ้าเลือกบัญชีมาครบ — ผูก entryId ไว้ด้วย เพื่อไม่ให้รายงานภาษีซื้อ
  // นับซ้ำกับใบสำคัญใบเดียวกันที่ถูกดึงมาจากสมุดรายวัน (ดู journalTaxLines.ts)
  let entryId: string | null = null;
  if (expenseAccountId && creditAccountId) {
    const inputVatAccount = await prisma.accAccount.findUnique({ where: { code: SYSTEM_ACCOUNTS.INPUT_VAT }, select: { id: true } });
    if (!inputVatAccount) {
      return NextResponse.json({ error: `ไม่พบบัญชีภาษีซื้อรหัส ${SYSTEM_ACCOUNTS.INPUT_VAT} ในผังบัญชี` }, { status: 400 });
    }
    try {
      const entry = await createEntry({
        date: parseDateOnly(invoiceDate),
        journalType: "PURCHASE",
        description: `ซื้อ ${String(vendorName).trim()} ใบกำกับ ${String(invoiceNo).trim()}`,
        userId: staff.staffId,
        lines: [
          { accountId: expenseAccountId, debit: toBaht(base), partnerId: partnerId || null, memo: description || undefined },
          { accountId: inputVatAccount.id, debit: toBaht(vat), memo: "ภาษีซื้อ" },
          { accountId: creditAccountId, credit: toBaht(base + vat), partnerId: partnerId || null },
        ],
      });
      entryId = entry.id;
    } catch (e) {
      if (e instanceof AccountingError) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  }

  const invoice = await prisma.accPurchaseTaxInvoice.create({
    data: {
      invoiceNo: String(invoiceNo).trim(),
      invoiceDate: parseDateOnly(invoiceDate),
      partnerId: partnerId || null,
      vendorName: String(vendorName).trim(),
      vendorTaxId: vendorTaxId || null,
      vendorBranchTag: vendorBranchTag || null,
      description: description || "ค่าสินค้า/บริการ",
      baseAmount: toBaht(base),
      vatAmount: toBaht(vat),
      totalAmount: toBaht(base + vat),
      isClaimable: isClaimable !== false,
      entryId,
      note: note || null,
      createdBy: staff.staffId,
    },
  });

  return NextResponse.json({ invoice });
}
