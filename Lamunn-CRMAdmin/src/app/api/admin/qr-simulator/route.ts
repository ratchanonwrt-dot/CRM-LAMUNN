import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { requireStaff } from "@/lib/requireStaff";
import { buildSignedQrContent } from "@lamunn/db";

const schema = z.object({
  branchCode: z.string().min(1),
  receiptNo: z.string().min(1),
  amount: z.coerce.number().positive(),
});

// Dev/testing helper only: lets an admin generate a QR identical in shape to what
// the POS is expected to print, so the scan flow can be exercised end to end before
// the POS side implements signing. Not linked from customer-facing pages.
export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const scanBaseUrl = `${process.env.CUSTOMER_APP_URL}/scan`;
  const secret = process.env.POS_QR_SECRET ?? "";
  const content = buildSignedQrContent(
    { scanBaseUrl, branchCode: parsed.data.branchCode.toUpperCase(), receiptNo: parsed.data.receiptNo, amount: parsed.data.amount },
    secret
  );
  const dataUrl = await QRCode.toDataURL(content, { width: 300 });

  return NextResponse.json({ ok: true, content, dataUrl });
}
