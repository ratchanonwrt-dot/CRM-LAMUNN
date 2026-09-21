import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    eventDate,
    eventStartTime,
    eventEndTime,
    location,
    guestCount,
    totalAmount,
    depositAmount,
    depositPaidAt,
    balancePaidAt,
    paymentStatus,
    status,
    note,
  } = body;

  const booking = await prisma.cateringBooking.update({
    where: { id: params.id },
    data: {
      ...(eventDate !== undefined ? { eventDate: new Date(eventDate) } : {}),
      ...(eventStartTime !== undefined ? { eventStartTime: eventStartTime || null } : {}),
      ...(eventEndTime !== undefined ? { eventEndTime: eventEndTime || null } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
      ...(guestCount !== undefined ? { guestCount: guestCount ? Number(guestCount) : null } : {}),
      ...(totalAmount !== undefined ? { totalAmount: Number(totalAmount) } : {}),
      ...(depositAmount !== undefined ? { depositAmount: depositAmount === null ? null : Number(depositAmount) } : {}),
      ...(depositPaidAt !== undefined ? { depositPaidAt: depositPaidAt ? new Date(depositPaidAt) : null } : {}),
      ...(balancePaidAt !== undefined ? { balancePaidAt: balancePaidAt ? new Date(balancePaidAt) : null } : {}),
      ...(paymentStatus !== undefined ? { paymentStatus } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });

  return NextResponse.json({ booking });
}
