import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { syncCateringBookingDays } from "@/lib/cateringBookingDays";

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    phone,
    customerName,
    source,
    eventDate,
    eventEndDate,
    eventStartTime,
    eventEndTime,
    location,
    guestCount,
    totalAmount,
    depositAmount,
  } = body;

  if (!phone || !customerName || !eventDate || totalAmount === undefined) {
    return NextResponse.json({ error: "phone, customerName, eventDate, totalAmount are required" }, { status: 400 });
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name: customerName, ...(source ? { source } : {}) },
    create: { phone, name: customerName, source: source || null },
  });

  const booking = await prisma.cateringBooking.create({
    data: {
      customerId: customer.id,
      eventDate: new Date(eventDate),
      eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
      eventStartTime: eventStartTime || null,
      eventEndTime: eventEndTime || null,
      location: location || null,
      guestCount: guestCount ? Number(guestCount) : null,
      totalAmount: Number(totalAmount),
      depositAmount: depositAmount ? Number(depositAmount) : null,
      paymentStatus: depositAmount ? "DEPOSIT_PAID" : "UNPAID",
      depositPaidAt: depositAmount ? new Date() : null,
      createdByStaffId: staff.staffId,
    },
  });
  await syncCateringBookingDays(booking.id, booking.eventDate, booking.eventEndDate);

  return NextResponse.json({ booking });
}
