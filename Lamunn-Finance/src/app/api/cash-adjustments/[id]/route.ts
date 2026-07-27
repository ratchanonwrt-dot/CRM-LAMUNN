import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.cashAdjustment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
