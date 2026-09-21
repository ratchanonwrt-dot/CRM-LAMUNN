import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { formatThaiDate } from "@/lib/format";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerName, customerPhone, branchId, amount, paymentStatus, orderDate, pickupDate, pickupTime, status, note } = body;

  const order = await prisma.pickupOrder.update({
    where: { id: params.id },
    data: {
      ...(customerName !== undefined ? { customerName } : {}),
      ...(customerPhone !== undefined ? { customerPhone: customerPhone || null } : {}),
      ...(branchId !== undefined ? { branchId: branchId || null } : {}),
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      ...(orderDate !== undefined ? { orderDate: new Date(orderDate) } : {}),
      ...(pickupDate !== undefined ? { pickupDate: new Date(pickupDate) } : {}),
      ...(pickupTime !== undefined ? { pickupTime: pickupTime || null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.pickupOrder.findUnique({ where: { id: params.id } });
  await prisma.pickupOrder.delete({ where: { id: params.id } });
  if (existing) {
    await logActivity({
      staffId: staff.staffId,
      staffName: staff.staffName,
      action: "DELETE",
      entity: "PickupOrder",
      summary: `ลบออเดอร์นัดรับ — ${existing.customerName} (${formatThaiDate(existing.pickupDate)})`,
    });
  }
  return NextResponse.json({ ok: true });
}
