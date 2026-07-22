import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestOtp } from "@/lib/otp";

const schema = z.object({
  phone: z.string().regex(/^0\d{9}$/, "รูปแบบเบอร์โทรไม่ถูกต้อง"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const { expiresAt } = await requestOtp(parsed.data.phone);
    return NextResponse.json({ ok: true, expiresAt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "ส่ง OTP ไม่สำเร็จ" }, { status: 502 });
  }
}
