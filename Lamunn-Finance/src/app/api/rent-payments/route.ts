import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("RENT", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) return NextResponse.json({ error: "year and month are required" }, { status: 400 });

  const rows = await prisma.rentPayment.findMany({ where: { year, month } });
  return NextResponse.json({ rows });
}

const STATUS_ORDER = ["PENDING", "TRANSFER_SCHEDULED", "PAID_AWAITING_BILL", "RECEIPT_RECEIVED"] as const;

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("RENT", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, year, month, status, minimumPaid, note } = body;
  if (!branchId || !year || !month || (status === undefined && minimumPaid === undefined)) {
    return NextResponse.json({ error: "branchId, year, month and (status or minimumPaid) are required" }, { status: 400 });
  }
  if (status !== undefined && !STATUS_ORDER.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const now = new Date();
  const data: Record<string, unknown> = {};
  if (note !== undefined) data.note = note || null;

  if (status !== undefined) {
    data.status = status;
    // ตราเวลาแต่ละสถานะ — บันทึกไว้ตอนที่ "ผ่าน" สถานะนั้นครั้งแรก (ย้อนกลับแล้วเดินหน้าใหม่ไม่ทับเวลาที่เคยบันทึกไว้)
    if (status === "TRANSFER_SCHEDULED") data.transferredAt = now;
    if (status === "PAID_AWAITING_BILL") data.paidAt = now;
    if (status === "RECEIPT_RECEIVED") data.receiptAt = now;
    if (status === "PENDING") {
      data.transferredAt = null;
      data.paidAt = null;
      data.receiptAt = null;
    }
  }

  if (minimumPaid !== undefined) {
    data.minimumPaid = !!minimumPaid;
    data.minimumPaidAt = minimumPaid ? now : null;
  }

  const row = await prisma.rentPayment.upsert({
    where: { branchId_year_month: { branchId, year: Number(year), month: Number(month) } },
    update: data,
    create: { branchId, year: Number(year), month: Number(month), ...data },
  });

  return NextResponse.json({ row });
}
