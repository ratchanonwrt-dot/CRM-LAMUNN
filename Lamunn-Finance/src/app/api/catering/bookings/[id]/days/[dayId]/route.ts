import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; dayId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { servings, note } = body;

  const day = await prisma.cateringBookingDay.update({
    where: { id: params.dayId },
    data: {
      ...(servings !== undefined ? { servings: servings === "" || servings === null ? null : Number(servings) } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json({ day });
}
