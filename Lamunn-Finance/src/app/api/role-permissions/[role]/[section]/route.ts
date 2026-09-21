import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff, type Role } from "@/lib/requireStaff";
import { PERMISSION_SECTIONS, SECTION_LABELS, type PermissionSection, revalidatePermissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

const EDITABLE_ROLES: Role[] = ["MANAGER", "STAFF", "CATERING_STAFF"];

export async function PATCH(req: NextRequest, { params }: { params: { role: string; section: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // SUPER_ADMIN always has full access regardless of this table (see permissions.ts) — reject
  // edits here too so the matrix UI can't imply otherwise or drift out of sync with that bypass.
  if (!EDITABLE_ROLES.includes(params.role as Role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  if (!PERMISSION_SECTIONS.includes(params.section as PermissionSection)) {
    return NextResponse.json({ error: "invalid section" }, { status: 400 });
  }
  const role = params.role as Role;
  const section = params.section as PermissionSection;

  const body = await req.json();
  let canView = Boolean(body.canView);
  let canEdit = Boolean(body.canEdit);
  // แก้ไขได้ต้องดูได้ด้วยเสมอ — กันสถานะที่แก้ได้แต่มองไม่เห็นหน้า
  if (canEdit) canView = true;

  const row = await prisma.rolePermission.upsert({
    where: { role_section: { role, section } },
    update: { canView, canEdit },
    create: { role, section, canView, canEdit },
  });

  // สิทธิ์ถูกแคชไว้เพื่อไม่ให้ทุกหน้าต้องยิง DB ซ้ำ — ล้างทิ้งทันทีที่แก้ ไม่งั้นผู้ใช้จะยังเห็นสิทธิ์เดิม
  revalidatePermissions();

  const level = canEdit ? "แก้ไขได้" : canView ? "ดูได้อย่างเดียว" : "ปิดสิทธิ์";
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "UPDATE",
    entity: "RolePermission",
    summary: `แก้ไขสิทธิ์ ${role} — ${SECTION_LABELS[section]}: ${level}`,
  });

  return NextResponse.json({ row });
}
