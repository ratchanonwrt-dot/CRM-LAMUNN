import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireOwner } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

export async function GET() {
  const staff = await requireOwner();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payments = await prisma.dividendPayment.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const staff = await requireOwner();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, amount, note } = body;
  if (!date || amount === undefined || amount === "") {
    return NextResponse.json({ error: "date and amount are required" }, { status: 400 });
  }

  const payment = await prisma.dividendPayment.create({
    data: { date: parseDateOnly(date), amount: Number(amount), note: note || null },
  });

  return NextResponse.json({ payment });
}
