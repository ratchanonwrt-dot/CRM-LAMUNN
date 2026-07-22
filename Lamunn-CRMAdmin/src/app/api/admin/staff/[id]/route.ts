import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF", "MARKETING"]).optional(),
  branchId: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "BRANCH_MANAGER"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const target = await prisma.staffUser.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });
  if (staff.role === "BRANCH_MANAGER" && target.branchId !== staff.branchId) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  // Branch managers may only edit STAFF rows and can't promote to another role/branch.
  if (staff.role === "BRANCH_MANAGER") {
    if (parsed.data.role && parsed.data.role !== "STAFF") {
      return NextResponse.json({ error: "ผู้จัดการสาขาแก้บทบาทได้แค่พนักงาน" }, { status: 403 });
    }
    if (parsed.data.branchId && parsed.data.branchId !== staff.branchId) {
      return NextResponse.json({ error: "ผู้จัดการสาขาย้ายสาขาให้พนักงานไม่ได้" }, { status: 403 });
    }
  }

  const role = parsed.data.role ?? target.role;
  const isHqRole = role === "SUPER_ADMIN" || role === "MARKETING";
  if (!isHqRole && !parsed.data.branchId && !target.branchId) {
    return NextResponse.json({ error: "กรุณาเลือกสาขา" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  if (parsed.data.role !== undefined) {
    data.role = parsed.data.role;
    data.branchId = isHqRole ? null : (parsed.data.branchId ?? target.branchId);
  } else if (parsed.data.branchId !== undefined) {
    data.branchId = parsed.data.branchId;
  }

  try {
    const updated = await prisma.staffUser.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, staff: updated });
  } catch {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้ไปแล้ว" }, { status: 409 });
  }
}
