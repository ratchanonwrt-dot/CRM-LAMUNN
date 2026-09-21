import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemName, quantity, note } = body;
  if (!itemName) return NextResponse.json({ error: "itemName is required" }, { status: 400 });

  const count = await prisma.cateringChecklistItem.count({ where: { bookingId: params.id } });
  const item = await prisma.cateringChecklistItem.create({
    data: {
      bookingId: params.id,
      itemName,
      quantity: quantity ? Number(quantity) : null,
      note: note || null,
      sortOrder: count,
    },
  });

  return NextResponse.json({ item });
}
