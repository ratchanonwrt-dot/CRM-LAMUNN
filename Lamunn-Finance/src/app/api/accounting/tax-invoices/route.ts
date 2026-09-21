import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { splitVatInclusive, addVatExclusive, toBaht, toSatang } from "@/lib/accounting/money";

/** เลขที่ใบกำกับภาษีรันต่อเนื่องต่อเดือน เช่น INV-6808-0007
 * (สรรพากรกำหนดว่าเลขที่ต้องเรียงต่อเนื่อง ห้ามข้าม — ระบบจึงออกเลขให้เอง ไม่ให้พิมพ์เอง) */
async function nextDocNo(prefix: string, issueDate: Date): Promise<string> {
  const be = (issueDate.getUTCFullYear() + 543) % 100;
  const mm = String(issueDate.getUTCMonth() + 1).padStart(2, "0");
  const head = `${prefix}-${String(be).padStart(2, "0")}${mm}-`;
  const last = await prisma.accTaxInvoice.findFirst({
    where: { docNo: { startsWith: head } },
    orderBy: { docNo: "desc" },
    select: { docNo: true },
  });
  const seq = last ? Number(last.docNo.slice(head.length)) + 1 : 1;
  return `${head}${String(seq).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    issueDate,
    saleDate,
    branchId,
    channel,
    receiptNo,
    customerName,
    taxId,
    branchTag,
    address,
    description,
    amount,
    amountIncludesVat,
    deductFromBulk,
    note,
  } = body;

  if (!issueDate || !saleDate || !customerName || !amount) {
    return NextResponse.json({ error: "กรอกวันที่ออกใบ วันที่ขาย ชื่อลูกค้า และยอดเงินให้ครบ" }, { status: 400 });
  }

  const settings = await getAllSettings();
  const vatRate = Number(settings.vatRate);
  const amountSatang = toSatang(amount);
  if (amountSatang <= 0) return NextResponse.json({ error: "ยอดเงินต้องมากกว่า 0" }, { status: 400 });

  const { base, vat } =
    amountIncludesVat === false ? addVatExclusive(amountSatang, vatRate) : splitVatInclusive(amountSatang, vatRate);

  const issue = parseDateOnly(issueDate);
  const docNo = await nextDocNo(settings.taxInvoicePrefix || "INV", issue);

  const invoice = await prisma.accTaxInvoice.create({
    data: {
      docNo,
      issueDate: issue,
      saleDate: parseDateOnly(saleDate),
      branchId: branchId || null,
      channel: channel || "STOREFRONT",
      receiptNo: receiptNo || null,
      customerName: String(customerName).trim(),
      taxId: taxId || null,
      branchTag: branchTag || null,
      address: address || null,
      description: description || "อาหารและเครื่องดื่ม",
      baseAmount: toBaht(base),
      vatAmount: toBaht(vat),
      totalAmount: toBaht(base + vat),
      deductFromBulk: deductFromBulk !== false,
      note: note || null,
      createdBy: staff.staffId,
    },
  });

  return NextResponse.json({ invoice });
}
