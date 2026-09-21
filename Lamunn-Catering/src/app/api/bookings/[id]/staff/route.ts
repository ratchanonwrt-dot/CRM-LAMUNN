import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { staffId, roleLabel } = body;
  if (!staffId || !roleLabel) return NextResponse.json({ error: "staffId, roleLabel are required" }, { status: 400 });

  const assignment = await prisma.cateringBookingStaff.upsert({
    where: { bookingId_staffId: { bookingId: params.id, staffId } },
    update: { roleLabel },
    create: { bookingId: params.id, staffId, roleLabel },
    include: { staff: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ assignment });
}
