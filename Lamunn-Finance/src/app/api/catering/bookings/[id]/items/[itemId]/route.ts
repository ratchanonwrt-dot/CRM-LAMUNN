import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { recomputeBookingTotal } from "@/lib/cateringItemsTotal";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, quantity, unitPrice } = body;

  const item = await prisma.cateringBookingItem.update({
    where: { id: params.itemId },
    data: {
      ...(description !== undefined ? { description } : {}),
      ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
      ...(unitPrice !== undefined ? { unitPrice: Number(unitPrice) } : {}),
    },
  });
  await recomputeBookingTotal(params.id);

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.cateringBookingItem.delete({ where: { id: params.itemId } });
  await recomputeBookingTotal(params.id);

  return NextResponse.json({ ok: true });
}
