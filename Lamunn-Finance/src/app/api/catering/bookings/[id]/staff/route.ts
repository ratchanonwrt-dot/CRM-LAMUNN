import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { staffName } = body;
  if (!staffName) return NextResponse.json({ error: "staffName is required" }, { status: 400 });

  const assignment = await prisma.cateringBookingStaff.create({
    data: { bookingId: params.id, staffName },
  });

  return NextResponse.json({ assignment });
}
