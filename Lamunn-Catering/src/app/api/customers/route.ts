import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff } from "@/lib/requireStaff";

// ?phone=xxx = exact lookup (ใช้ตอนกรอกจองใหม่ auto-fill ลูกค้าเดิม)
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const phone = req.nextUrl.searchParams.get("phone");
  if (phone) {
    const customer = await prisma.customer.findUnique({ where: { phone } });
    return NextResponse.json({ customer });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });
  return NextResponse.json({ customers });
}
