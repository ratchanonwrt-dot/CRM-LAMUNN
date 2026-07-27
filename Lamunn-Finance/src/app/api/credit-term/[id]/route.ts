import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, note } = body;

  const payment = await prisma.creditTermPayment.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined ? { status, paidAt: status === "PAID" ? new Date() : null } : {}),
      ...(note !== undefined ? { note } : {}),
    },
  });

  return NextResponse.json({ payment });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.creditTermPayment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
