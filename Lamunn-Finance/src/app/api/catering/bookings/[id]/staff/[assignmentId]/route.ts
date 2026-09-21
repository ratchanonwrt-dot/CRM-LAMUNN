import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.cateringBookingStaff.delete({ where: { id: params.assignmentId } });
  return NextResponse.json({ ok: true });
}
