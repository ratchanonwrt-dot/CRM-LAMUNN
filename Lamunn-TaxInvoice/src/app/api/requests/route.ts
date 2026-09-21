import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyQrPayload } from "@/lib/qr";
import { isValidThaiTaxId } from "@/lib/taxId";
import { processTaxInvoiceRequest } from "@/lib/processRequest";

const POS_QR_SECRET = process.env.POS_QR_SECRET ?? "";
const QR_VALID_HOURS = Number(process.env.QR_VALID_HOURS ?? 72);

const schema = z.object({
  qr: z.string().min(1),
  customerType: z.enum(["INDIVIDUAL", "COMPANY"]),
  fullName: z.string().min(1),
  taxId: z.string().min(13).max(13),
  branchTag: z.string().min(1).nullable(),
  address: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1).nullable(),
});

const QR_ERROR_MESSAGES: Record<string, string> = {
  MALFORMED: "ไม่สามารถอ่านข้อมูลจาก QR นี้ได้",
  INVALID_SIGNATURE: "QR นี้ไม่ผ่านการตรวจสอบความถูกต้อง กรุณาติดต่อพนักงาน",
  EXPIRED: "QR นี้หมดอายุแล้ว กรุณาติดต่อพนักงานหน้าร้าน",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" }, { status: 400 });
  }
  const input = parsed.data;

  // Never trust the client-parsed receipt info — re-verify the raw QR string here.
  const verification = verifyQrPayload(input.qr, { secret: POS_QR_SECRET, validHours: QR_VALID_HOURS });
  if (!verification.ok) {
    return NextResponse.json({ error: QR_ERROR_MESSAGES[verification.reason] }, { status: 400 });
  }

  if (!isValidThaiTaxId(input.taxId)) {
    return NextResponse.json({ error: "เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง" }, { status: 400 });
  }

  const { branchCode, receiptNo, amount, timestampSec } = verification.payload;

  const existing = await prisma.taxInvoiceRequest.findUnique({
    where: { branchCode_receiptNo: { branchCode, receiptNo } },
  });
  if (existing) {
    return NextResponse.json({ error: "ใบเสร็จนี้ขอใบกำกับภาษีไปแล้ว", id: existing.id }, { status: 409 });
  }

  const record = await prisma.taxInvoiceRequest.create({
    data: {
      qrRawPayload: input.qr,
      branchCode,
      receiptNo,
      amount,
      saleTimestamp: new Date(timestampSec * 1000),
      signed: verification.signed,
      customerType: input.customerType,
      fullName: input.fullName,
      taxId: input.taxId,
      branchTag: input.branchTag,
      address: input.address,
      email: input.email,
      phone: input.phone,
      status: "PENDING",
    },
  });

  await processTaxInvoiceRequest(record);

  return NextResponse.json({ ok: true, id: record.id });
}
