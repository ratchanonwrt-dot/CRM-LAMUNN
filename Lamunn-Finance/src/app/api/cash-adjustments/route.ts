import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { CASH_ON_HAND_CACHE_TAG } from "@/lib/finance";

export async function GET() {
  const staff = await requireSectionApi("CASH_STATUS", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const adjustments = await prisma.cashAdjustment.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json({ adjustments });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CASH_STATUS", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, amount, label, note } = body;
  if (!date || amount === undefined || amount === "" || !label) {
    return NextResponse.json({ error: "date, amount, label are required" }, { status: 400 });
  }

  const adjustment = await prisma.cashAdjustment.create({
    data: { date: parseDateOnly(date), amount: Number(amount), label, note: note || null },
  });

  revalidateTag(CASH_ON_HAND_CACHE_TAG); // ยอดปรับปรุงกระทบเงินสดสะสมที่ cache ไว้
  return NextResponse.json({ adjustment });
}
