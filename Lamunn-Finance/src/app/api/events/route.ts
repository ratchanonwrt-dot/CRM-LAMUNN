import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const events = await prisma.eventSale.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, startDate, endDate, location, storefront, grab, lineman, note } = body;
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "name, startDate, endDate are required" }, { status: 400 });
  }

  const event = await prisma.eventSale.create({
    data: {
      name,
      startDate: parseDateOnly(startDate),
      endDate: parseDateOnly(endDate),
      location: location || null,
      storefront: Number(storefront) || 0,
      grab: Number(grab) || 0,
      lineman: Number(lineman) || 0,
      note: note || null,
    },
  });

  return NextResponse.json({ event });
}
