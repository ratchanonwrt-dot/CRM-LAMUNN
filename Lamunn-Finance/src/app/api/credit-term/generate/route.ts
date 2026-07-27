import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";
import { computePeriodReceivable } from "@/lib/creditTermCalc";

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, periodStart, periodEnd, dueDate } = body;
  if (!branchId || !periodStart || !periodEnd || !dueDate) {
    return NextResponse.json({ error: "branchId, periodStart, periodEnd, dueDate are required" }, { status: 400 });
  }

  const start = parseDateOnly(periodStart);
  const end = parseDateOnly(periodEnd);
  const computed = await computePeriodReceivable(branchId, start, end);

  const existing = await prisma.creditTermPayment.findFirst({
    where: { branchId, periodStart: start, periodEnd: end },
  });

  const financialFields = {
    grossStorefront: computed.grossStorefront,
    grossDelivery: computed.grossDelivery,
    gpDeductStorefront: computed.gpDeductStorefront,
    gpDeductDelivery: computed.gpDeductDelivery,
    vendorFeeDeduct: computed.vendorFeeDeduct,
    netAmount: computed.netAmount,
    dueDate: parseDateOnly(dueDate),
  };

  const payment = existing
    ? await prisma.creditTermPayment.update({ where: { id: existing.id }, data: financialFields })
    : await prisma.creditTermPayment.create({
        data: { branchId, periodStart: start, periodEnd: end, status: "PENDING", ...financialFields },
      });

  return NextResponse.json({ payment });
}
