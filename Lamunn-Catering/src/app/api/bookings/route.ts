import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    phone,
    customerName,
    source,
    eventDate,
    eventStartTime,
    eventEndTime,
    location,
    guestCount,
    packageId,
    totalAmount,
    depositAmount,
  } = body;

  if (!phone || !customerName || !eventDate || totalAmount === undefined) {
    return NextResponse.json({ error: "phone, customerName, eventDate, totalAmount are required" }, { status: 400 });
  }

  // ค้นหาลูกค้าเดิมด้วยเบอร์โทร — ถ้าไม่เจอสร้างใหม่ ถ้าเจอแล้วอัปเดตชื่อ/ช่องทางถ้ามีการแก้ไข
  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name: customerName, ...(source ? { source } : {}) },
    create: { phone, name: customerName, source: source || null },
  });

  let packageNameSnapshot: string | null = null;
  let packagePriceSnapshot: number | null = null;
  if (packageId) {
    const pkg = await prisma.cateringPackage.findUnique({ where: { id: packageId } });
    if (pkg) {
      packageNameSnapshot = pkg.name;
      packagePriceSnapshot = pkg.price;
    }
  }

  const booking = await prisma.cateringBooking.create({
    data: {
      customerId: customer.id,
      eventDate: new Date(eventDate),
      eventStartTime: eventStartTime || null,
      eventEndTime: eventEndTime || null,
      location: location || null,
      guestCount: guestCount ? Number(guestCount) : null,
      packageId: packageId || null,
      packageNameSnapshot,
      packagePriceSnapshot,
      totalAmount: Number(totalAmount),
      depositAmount: depositAmount ? Number(depositAmount) : null,
      paymentStatus: depositAmount ? "DEPOSIT_PAID" : "UNPAID",
      depositPaidAt: depositAmount ? new Date() : null,
      createdByStaffId: staff.staffId,
    },
  });

  return NextResponse.json({ booking });
}
