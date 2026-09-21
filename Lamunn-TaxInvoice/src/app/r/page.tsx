import { verifyQrPayload } from "@/lib/qr";
import { prisma } from "@/lib/db";
import TaxInvoiceForm from "@/components/TaxInvoiceForm";

const POS_QR_SECRET = process.env.POS_QR_SECRET ?? "";
const QR_VALID_HOURS = Number(process.env.QR_VALID_HOURS ?? 72);

const ERROR_MESSAGES: Record<string, string> = {
  MALFORMED: "ไม่สามารถอ่านข้อมูลจาก QR นี้ได้ กรุณาสแกนใหม่อีกครั้ง",
  INVALID_SIGNATURE: "QR นี้ไม่ผ่านการตรวจสอบความถูกต้อง กรุณาติดต่อพนักงาน",
  EXPIRED: "QR นี้หมดอายุแล้ว กรุณาติดต่อพนักงานหน้าร้าน",
};

export default async function ScanRequestPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") query.set(key, value);
  }
  const rawQr = query.toString();

  const verification = verifyQrPayload(rawQr, { secret: POS_QR_SECRET, validHours: QR_VALID_HOURS });

  if (!verification.ok) {
    return (
      <main className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-lg font-semibold text-red-700">ไม่สามารถขอใบกำกับภาษีได้</h1>
        <p className="text-gray-600">{ERROR_MESSAGES[verification.reason]}</p>
      </main>
    );
  }

  const { branchCode, receiptNo, amount, timestampSec } = verification.payload;

  const existing = await prisma.taxInvoiceRequest.findUnique({
    where: { branchCode_receiptNo: { branchCode, receiptNo } },
  });

  if (existing) {
    return (
      <main className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-lg font-semibold">ใบเสร็จนี้ขอใบกำกับภาษีไปแล้ว</h1>
        <p className="text-gray-600">
          ใบเสร็จเลขที่ {receiptNo} มีคำขอใบกำกับภาษีอยู่แล้ว (สถานะ: {existing.status})
        </p>
        <p className="text-sm text-gray-500">
          หากยังไม่ได้รับอีเมล กรุณาตรวจสอบโฟลเดอร์สแปม หรือติดต่อพนักงาน
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold">ขอใบกำกับภาษี</h1>
        <p className="text-sm text-gray-500">กรอกข้อมูลที่อยู่สำหรับออกใบกำกับภาษี</p>
      </div>

      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">สาขา</span>
          <span className="font-medium">{branchCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">เลขที่ใบเสร็จ</span>
          <span className="font-medium">{receiptNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">ยอดเงิน</span>
          <span className="font-medium">
            🔒 {amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">* ยอดเงินถูกล็อคจากข้อมูลใบเสร็จ ไม่สามารถแก้ไขได้</p>
        <div className="flex justify-between">
          <span className="text-gray-600">วันที่ซื้อ</span>
          <span className="font-medium">{new Date(timestampSec * 1000).toLocaleDateString("th-TH")}</span>
        </div>
        {!verification.signed && (
          <p className="mt-2 text-xs text-amber-700">
            * QR นี้ยังไม่มีลายเซ็นจากระบบ POS (POS อยู่ระหว่างพัฒนา) คำขอนี้จะถูกทำเครื่องหมายให้ตรวจสอบยอดอีกครั้งก่อนออกใบกำกับภาษี
          </p>
        )}
      </div>

      <TaxInvoiceForm rawQr={rawQr} />
    </main>
  );
}
