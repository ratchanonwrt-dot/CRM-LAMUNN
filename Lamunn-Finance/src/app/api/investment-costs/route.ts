import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";

export async function GET() {
  const staff = await requireSectionApi("INVESTMENT_COST", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const items = await prisma.investmentCost.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("INVESTMENT_COST", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, description, amount, resaleValue, note } = await req.json();
  if (!date || !description || !amount) {
    return NextResponse.json({ error: "กรอกวันที่ รายการ และจำนวนเงินให้ครบ" }, { status: 400 });
  }
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  const resale = resaleValue === "" || resaleValue === undefined || resaleValue === null ? null : Number(resaleValue);
  if (resale !== null && (!Number.isFinite(resale) || resale < 0)) return NextResponse.json({ error: "ราคาขายทิ้งไม่ถูกต้อง" }, { status: 400 });

  const item = await prisma.investmentCost.create({
    data: { date: parseDateOnly(date), description: String(description).trim(), amount: n, resaleValue: resale, note: note || null },
  });
  return NextResponse.json({ item });
}
