import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const periodStart = searchParams.get("periodStart");
  const periodEnd = searchParams.get("periodEnd");
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const rows = await prisma.branchBilling.findMany({
    where: { periodStart: parseDateOnly(periodStart), periodEnd: parseDateOnly(periodEnd) },
  });
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, periodStart, periodEnd, storefrontSalesIncVat, deliverySalesIncVat, billingDate, note } = body;
  if (!branchId || !periodStart || !periodEnd) {
    return NextResponse.json({ error: "branchId, periodStart, periodEnd are required" }, { status: 400 });
  }

  const start = parseDateOnly(periodStart);
  const end = parseDateOnly(periodEnd);
  const data = {
    storefrontSalesIncVat: Number(storefrontSalesIncVat) || 0,
    deliverySalesIncVat: Number(deliverySalesIncVat) || 0,
    billingDate: billingDate ? parseDateOnly(billingDate) : null,
    note: note || null,
  };

  const row = await prisma.branchBilling.upsert({
    where: { branchId_periodStart_periodEnd: { branchId, periodStart: start, periodEnd: end } },
    update: data,
    create: { branchId, periodStart: start, periodEnd: end, ...data },
  });

  return NextResponse.json({ row });
}
