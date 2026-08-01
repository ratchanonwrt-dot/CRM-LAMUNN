import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setLogoImageUrl, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({ logoImageUrl: z.string().url().nullable() });

export async function PATCH(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const settings = await setLogoImageUrl(parsed.data.logoImageUrl);

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "AppSettings",
    summary: "เปลี่ยนโลโก้หน้าแรก/หน้าล็อกอิน",
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, settings });
}
