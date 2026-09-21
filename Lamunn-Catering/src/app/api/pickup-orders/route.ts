import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerName, customerPhone, branchId, itemsDescription, amount, orderDate, pickupDate, note } = body;

  if (!customerName || !itemsDescription || amount === undefined || !orderDate || !pickupDate) {
    return NextResponse.json(
      { error: "customerName, itemsDescription, amount, orderDate, pickupDate are required" },
      { status: 400 }
    );
  }

  const order = await prisma.pickupOrder.create({
    data: {
      customerName,
      customerPhone: customerPhone || null,
      branchId: branchId || null,
      itemsDescription,
      amount: Number(amount),
      orderDate: new Date(orderDate),
      pickupDate: new Date(pickupDate),
      note: note || null,
      createdByStaffId: staff.staffId,
    },
  });

  return NextResponse.json({ order });
}
