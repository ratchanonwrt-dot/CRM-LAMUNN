import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

const STATUS_TEXT: Record<string, { title: string; detail: string; tone: "ok" | "wait" | "error" }> = {
  PENDING: { title: "กำลังดำเนินการ", detail: "คำขอของคุณอยู่ระหว่างดำเนินการ กรุณารอสักครู่", tone: "wait" },
  AWAITING_FLOWACCOUNT_SETUP: {
    title: "รับคำขอแล้ว",
    detail: "เราได้รับคำขอของคุณแล้ว ทีมงานจะจัดส่งใบกำกับภาษีให้ทางอีเมลภายใน 1-2 วันทำการ",
    tone: "wait",
  },
  ISSUED: { title: "ออกใบกำกับภาษีแล้ว", detail: "กำลังจัดส่งอีเมล กรุณารอสักครู่", tone: "ok" },
  EMAIL_SENT: { title: "สำเร็จ", detail: "ใบกำกับภาษีถูกส่งไปยังอีเมลของคุณแล้ว", tone: "ok" },
  FAILED: {
    title: "เกิดข้อผิดพลาด",
    detail: "ทีมงานได้รับแจ้งแล้วและจะติดต่อกลับเพื่อดำเนินการต่อ ขออภัยในความไม่สะดวก",
    tone: "error",
  },
};

export default async function StatusPage({ params }: { params: { id: string } }) {
  const record = await prisma.taxInvoiceRequest.findUnique({ where: { id: params.id } });
  if (!record) notFound();

  const info = STATUS_TEXT[record.status] ?? STATUS_TEXT.PENDING;
  const toneClass =
    info.tone === "ok" ? "text-brand-700" : info.tone === "error" ? "text-red-700" : "text-amber-700";

  return (
    <main className="mx-auto max-w-md space-y-4 text-center">
      <h1 className={`text-lg font-semibold ${toneClass}`}>{info.title}</h1>
      <p className="text-gray-600">{info.detail}</p>

      <div className="rounded-lg border border-gray-200 bg-white p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">เลขที่ใบเสร็จ</span>
          <span className="font-medium">{record.receiptNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ยอดเงิน</span>
          <span className="font-medium">{Number(record.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ส่งถึงอีเมล</span>
          <span className="font-medium">{record.email}</span>
        </div>
      </div>
    </main>
  );
}
