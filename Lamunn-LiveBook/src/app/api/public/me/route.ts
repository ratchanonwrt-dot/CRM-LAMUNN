import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ME_COOKIE, cleanPhone } from "@/lib/me";

export const dynamic = "force-dynamic";

/** จำเบอร์โทรไว้ 30 วัน เพื่อไฮไลต์/จัดการช่วงของตัวเอง */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = cleanPhone(body.phone);
  if (!phone) return NextResponse.json({ error: "กรุณากรอกเบอร์โทรให้ถูกต้อง (9-15 หลัก)" }, { status: 400 });
  cookies().set(ME_COOKIE, phone, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.json({ ok: true, phone });
}

export async function DELETE() {
  cookies().set(ME_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
