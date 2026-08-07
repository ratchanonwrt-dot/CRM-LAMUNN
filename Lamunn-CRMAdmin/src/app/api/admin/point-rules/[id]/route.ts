import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "BRANCH_MANAGER", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const rule = await prisma.pointRule.findUnique({ where: { id: params.id } });
  if (!rule) return NextResponse.json({ error: "ไม่พบกติกานี้" }, { status: 404 });

  if (staff.role === "BRANCH_MANAGER" && rule.branchId !== staff.branchId) {
    return NextResponse.json({ error: "ผู้จัดการสาขาลบได้เฉพาะกติกาของสาขาตนเอง" }, { status: 403 });
  }

  await prisma.pointRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
