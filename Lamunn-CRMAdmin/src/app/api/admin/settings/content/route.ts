import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSiteContent, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const nullableString = z.string().trim().min(1).nullable();

const schema = z.object({
  appName: nullableString.optional(),
  taglineTh: nullableString.optional(),
  taglineEn: nullableString.optional(),
  greetingMorningTh: nullableString.optional(),
  greetingMorningEn: nullableString.optional(),
  greetingAfternoonTh: nullableString.optional(),
  greetingAfternoonEn: nullableString.optional(),
  greetingEveningTh: nullableString.optional(),
  greetingEveningEn: nullableString.optional(),
  navHomeTh: nullableString.optional(),
  navHomeEn: nullableString.optional(),
  navRedeemTh: nullableString.optional(),
  navRedeemEn: nullableString.optional(),
});

export async function PATCH(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const settings = await setSiteContent(parsed.data);

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "AppSettings",
    summary: `แก้ไขเนื้อหาหน้าแรก (${Object.keys(parsed.data).join(", ") || "ไม่มีการเปลี่ยนแปลง"})`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, settings });
}
