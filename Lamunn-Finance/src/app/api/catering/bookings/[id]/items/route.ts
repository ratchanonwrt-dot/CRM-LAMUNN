import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { recomputeBookingTotal } from "@/lib/cateringItemsTotal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, quantity, unitPrice } = body;
  if (!description || unitPrice === undefined) {
    return NextResponse.json({ error: "description, unitPrice are required" }, { status: 400 });
  }

  const count = await prisma.cateringBookingItem.count({ where: { bookingId: params.id } });
  const item = await prisma.cateringBookingItem.create({
    data: {
      bookingId: params.id,
      description,
      quantity: quantity ? Number(quantity) : 1,
      unitPrice: Number(unitPrice),
      sortOrder: count,
    },
  });
  await recomputeBookingTotal(params.id);

  return NextResponse.json({ item });
}
