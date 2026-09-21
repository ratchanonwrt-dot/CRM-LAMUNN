import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { recomputePickupOrderAmount } from "@/lib/pickupOrderItemsTotal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, quantity, unitPrice } = body;
  if (!description || unitPrice === undefined) {
    return NextResponse.json({ error: "description, unitPrice are required" }, { status: 400 });
  }

  const count = await prisma.pickupOrderItem.count({ where: { pickupOrderId: params.id } });
  const item = await prisma.pickupOrderItem.create({
    data: {
      pickupOrderId: params.id,
      description,
      quantity: quantity ? Number(quantity) : 1,
      unitPrice: Number(unitPrice),
      sortOrder: count,
    },
  });
  await recomputePickupOrderAmount(params.id);

  return NextResponse.json({ item });
}
