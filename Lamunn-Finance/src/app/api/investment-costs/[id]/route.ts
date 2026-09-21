import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("INVESTMENT_COST", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, description, amount, resaleValue, note } = body;

  const data: Record<string, unknown> = {};
  if (date !== undefined) data.date = parseDateOnly(date);
  if (description !== undefined) data.description = String(description).trim();
  if (amount !== undefined) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
    data.amount = n;
  }
  if (resaleValue !== undefined) {
    const resale = resaleValue === "" || resaleValue === null ? null : Number(resaleValue);
    if (resale !== null && (!Number.isFinite(resale) || resale < 0)) return NextResponse.json({ error: "ราคาขายทิ้งไม่ถูกต้อง" }, { status: 400 });
    data.resaleValue = resale;
  }
  if (note !== undefined) data.note = note || null;

  const item = await prisma.investmentCost.update({ where: { id: params.id }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("INVESTMENT_COST", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.investmentCost.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
