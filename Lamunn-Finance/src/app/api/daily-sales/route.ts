import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const date = searchParams.get("date");
  if (!branchId || !date) return NextResponse.json({ error: "branchId and date are required" }, { status: 400 });

  const row = await prisma.dailySales.findUnique({
    where: { branchId_date: { branchId, date: parseDateOnly(date) } },
  });
  return NextResponse.json({ row });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, date, cashPos, cashCounted, transfer, cashTransferCombined, grab, lineman, posCheckTotal, note } = body;
  if (!branchId || !date) return NextResponse.json({ error: "branchId and date are required" }, { status: 400 });

  const data = {
    cashPos: cashPos === "" || cashPos === undefined ? null : Number(cashPos),
    cashCounted: cashCounted === "" || cashCounted === undefined ? null : Number(cashCounted),
    transfer: transfer === "" || transfer === undefined ? null : Number(transfer),
    cashTransferCombined: cashTransferCombined === "" || cashTransferCombined === undefined ? null : Number(cashTransferCombined),
    grab: grab === "" || grab === undefined ? 0 : Number(grab),
    lineman: lineman === "" || lineman === undefined ? 0 : Number(lineman),
    posCheckTotal: posCheckTotal === "" || posCheckTotal === undefined ? null : Number(posCheckTotal),
    note: note || null,
  };

  const row = await prisma.dailySales.upsert({
    where: { branchId_date: { branchId, date: parseDateOnly(date) } },
    update: data,
    create: { branchId, date: parseDateOnly(date), ...data },
  });

  return NextResponse.json({ row });
}
