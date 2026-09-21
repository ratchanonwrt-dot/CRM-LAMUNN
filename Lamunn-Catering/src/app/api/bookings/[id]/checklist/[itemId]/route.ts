import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { isPacked, itemName, quantity, note } = body;

  const item = await prisma.cateringChecklistItem.update({
    where: { id: params.itemId },
    data: {
      ...(isPacked !== undefined ? { isPacked } : {}),
      ...(itemName !== undefined ? { itemName } : {}),
      ...(quantity !== undefined ? { quantity: quantity === null ? null : Number(quantity) } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.cateringChecklistItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ ok: true });
}
