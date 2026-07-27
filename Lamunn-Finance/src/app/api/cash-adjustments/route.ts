import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const adjustments = await prisma.cashAdjustment.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json({ adjustments });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, amount, label, note } = body;
  if (!date || amount === undefined || amount === "" || !label) {
    return NextResponse.json({ error: "date, amount, label are required" }, { status: 400 });
  }

  const adjustment = await prisma.cashAdjustment.create({
    data: { date: parseDateOnly(date), amount: Number(amount), label, note: note || null },
  });

  return NextResponse.json({ adjustment });
}
