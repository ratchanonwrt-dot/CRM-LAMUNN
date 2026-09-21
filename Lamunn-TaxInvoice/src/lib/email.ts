import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "ใบกำกับภาษี <invoice@example.com>";

let client: Resend | null = null;
function getClient(): Resend {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

export async function sendTaxInvoiceEmail(params: {
  to: string;
  fullName: string;
  receiptNo: string;
  amount: number;
  pdfUrl: string | null;
}) {
  const { to, fullName, receiptNo, amount, pdfUrl } = params;

  const amountText = amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  await getClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `ใบกำกับภาษีสำหรับใบเสร็จเลขที่ ${receiptNo}`,
    html: `
      <p>เรียนคุณ${fullName},</p>
      <p>ใบกำกับภาษีสำหรับใบเสร็จเลขที่ <b>${receiptNo}</b> ยอดเงิน <b>${amountText} บาท</b> พร้อมแล้ว</p>
      ${
        pdfUrl
          ? `<p><a href="${pdfUrl}">ดาวน์โหลดใบกำกับภาษี (PDF)</a></p>`
          : `<p>ทีมงานจะจัดส่งไฟล์ใบกำกับภาษีให้ท่านอีกครั้งภายใน 1-2 วันทำการ</p>`
      }
      <p>ขอบคุณที่ใช้บริการ</p>
    `,
  });
}

/** Sent when Flow Account isn't wired up yet — lets the customer know the request
 * was received and will be processed manually in the meantime. */
export async function sendAcknowledgementEmail(params: { to: string; fullName: string; receiptNo: string }) {
  const { to, fullName, receiptNo } = params;

  await getClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `รับคำขอใบกำกับภาษีแล้ว — ใบเสร็จเลขที่ ${receiptNo}`,
    html: `
      <p>เรียนคุณ${fullName},</p>
      <p>เราได้รับคำขอใบกำกับภาษีสำหรับใบเสร็จเลขที่ <b>${receiptNo}</b> แล้ว</p>
      <p>ทีมงานกำลังดำเนินการออกใบกำกับภาษีและจะจัดส่งให้ท่านทางอีเมลนี้โดยเร็วที่สุด</p>
    `,
  });
}
