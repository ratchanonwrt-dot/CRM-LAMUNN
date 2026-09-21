import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerName, customerPhone, branchId, amount, orderDate, pickupDate, pickupTime, note } = body;

  if (!customerName || amount === undefined || !orderDate || !pickupDate) {
    return NextResponse.json(
      { error: "customerName, amount, orderDate, pickupDate are required" },
      { status: 400 }
    );
  }

  const order = await prisma.pickupOrder.create({
    data: {
      customerName,
      customerPhone: customerPhone || null,
      branchId: branchId || null,
      amount: Number(amount),
      orderDate: new Date(orderDate),
      pickupDate: new Date(pickupDate),
      pickupTime: pickupTime || null,
      note: note || null,
      createdByStaffId: staff.staffId,
    },
  });

  return NextResponse.json({ order });
}
