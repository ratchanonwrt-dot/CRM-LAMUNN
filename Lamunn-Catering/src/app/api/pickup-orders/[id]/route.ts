import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerName, customerPhone, branchId, itemsDescription, amount, paymentStatus, orderDate, pickupDate, status, note } = body;

  const order = await prisma.pickupOrder.update({
    where: { id: params.id },
    data: {
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerPhone !== undefined ? { customerPhone: customerPhone || null } : {}),
      ...(branchId !== undefined ? { branchId: branchId || null } : {}),
      ...(itemsDescription !== undefined ? { itemsDescription } : {}),
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      ...(orderDate !== undefined ? { orderDate: new Date(orderDate) } : {}),
      ...(pickupDate !== undefined ? { pickupDate: new Date(pickupDate) } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json({ order });
}
