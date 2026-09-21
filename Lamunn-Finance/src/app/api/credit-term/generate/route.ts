import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { computePeriodReceivable, CREDIT_TERM_CACHE_TAG } from "@/lib/creditTermCalc";

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
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

  // ถ้าเคยปิดรอบนี้แล้วและทบยอดค้างจากงวดก่อนไว้แล้ว ให้ใช้ยอดที่ทบไว้เดิม (กันทบซ้ำเวลากดปิดรอบซ้ำ)
  // ไม่งั้นก็ใช้ยอดที่เพิ่งคำนวณสด (สำหรับรอบที่เพิ่งปิดรอบครั้งแรก)
  const carriedInAmount = existing?.carriedFromId ? existing.carriedInAmount : computed.carriedInAmount;
  const carriedFromId = existing?.carriedFromId ?? computed.carriedFromPaymentId;
  const netAmount = computed.rawNetAmount + carriedInAmount;

  const financialFields = {
    grossStorefront: computed.grossStorefront,
    grossDelivery: computed.grossDelivery,
    gpDeductStorefront: computed.gpDeductStorefront,
    gpDeductDelivery: computed.gpDeductDelivery,
    vendorFeeDeduct: computed.vendorFeeDeduct,
    netAmount,
    carriedInAmount,
    carriedFromId,
    dueDate: parseDateOnly(dueDate),
  };

  const payment = existing
    ? await prisma.creditTermPayment.update({ where: { id: existing.id }, data: financialFields })
    : await prisma.creditTermPayment.create({
        data: { branchId, periodStart: start, periodEnd: end, status: "PENDING", ...financialFields },
      });

  // mark ยอดค้างของงวดก่อนว่าถูกทบมาแล้ว — ทำแค่ครั้งแรกที่ทบเข้ามา ป้องกันไม่ให้ถูกทบซ้ำในรอบถัดไปอีก
  if (carriedFromId && !existing?.carriedFromId) {
    await prisma.creditTermPayment.update({ where: { id: carriedFromId }, data: { shortfallResolved: true } });
  }

  revalidateTag(CREDIT_TERM_CACHE_TAG);
  return NextResponse.json({ payment });
}
