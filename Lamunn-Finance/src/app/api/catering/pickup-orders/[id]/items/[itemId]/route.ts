import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { recomputePickupOrderAmount } from "@/lib/pickupOrderItemsTotal";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, quantity, unitPrice } = body;

  const item = await prisma.pickupOrderItem.update({
    where: { id: params.itemId },
    data: {
      ...(description !== undefined ? { description } : {}),
      ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
      ...(unitPrice !== undefined ? { unitPrice: Number(unitPrice) } : {}),
    },
  });
  await recomputePickupOrderAmount(params.id);

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.pickupOrderItem.delete({ where: { id: params.itemId } });
  await recomputePickupOrderAmount(params.id);

  return NextResponse.json({ ok: true });
}
