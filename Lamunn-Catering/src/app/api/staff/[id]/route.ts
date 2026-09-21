import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, type Role } from "@/lib/requireStaff";

const VALID_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "STAFF"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { role, isActive, password } = body;

  // ป้องกัน Super Admin ปิดการใช้งาน/ลดสิทธิ์ตัวเองจนล็อกตัวเองออกจากระบบ
  if (staff.staffId === params.id && (isActive === false || (role !== undefined && role !== "SUPER_ADMIN"))) {
    return NextResponse.json({ error: "ไม่สามารถลดสิทธิ์หรือปิดการใช้งานบัญชีตัวเองได้" }, { status: 400 });
  }

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "สิทธิ์ไม่ถูกต้อง" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.staffUser.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
