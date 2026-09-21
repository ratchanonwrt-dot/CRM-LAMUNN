import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CATERING", "view");
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
