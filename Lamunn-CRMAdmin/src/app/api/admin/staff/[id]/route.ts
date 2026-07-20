import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({ isActive: z.boolean() });

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
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const updated = await prisma.staffUser.update({ where: { id: params.id }, data: { isActive: parsed.data.isActive } });
  return NextResponse.json({ ok: true, staff: updated });
}
