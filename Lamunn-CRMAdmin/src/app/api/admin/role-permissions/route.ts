import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setRolePermission, logAudit, roleLabel, FEATURES, ROLES } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  role: z.enum(["SUPER_ADMIN", "STAFF", "MARKETING"]),
  feature: z.string().min(1),
  allowed: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const { role, feature, allowed } = parsed.data;
  if (role === "SUPER_ADMIN" || !ROLES.includes(role) || !FEATURES.some((f) => f.key === feature)) {
    return NextResponse.json({ error: "ไม่สามารถแก้ไขได้" }, { status: 400 });
  }

  await setRolePermission(role, feature as (typeof FEATURES)[number]["key"], allowed);

  const featureLabel = FEATURES.find((f) => f.key === feature)?.label ?? feature;
  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "RolePermission",
    entityId: `${role}:${feature}`,
    summary: `${allowed ? "เปิด" : "ปิด"}สิทธิ์ "${featureLabel}" ให้ ${roleLabel[role]}`,
    changes: { role, feature, allowed },
  });

  return NextResponse.json({ ok: true });
}
