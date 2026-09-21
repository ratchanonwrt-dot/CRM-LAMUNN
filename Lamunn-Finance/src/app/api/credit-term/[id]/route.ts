import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { formatBaht } from "@/lib/format";
import { CREDIT_TERM_CACHE_TAG } from "@/lib/creditTermCalc";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, note, receivedAmount } = body;

  const data: Record<string, unknown> = {};

  if (status !== undefined) {
    data.status = status;
    if (status === "PAID") {
      const existing = await prisma.creditTermPayment.findUnique({ where: { id: params.id }, select: { netAmount: true } });
      const received = typeof receivedAmount === "number" ? receivedAmount : existing?.netAmount ?? 0;
      data.paidAt = new Date();
      data.receivedAmount = received;
      data.shortfallAmount = Math.max(0, (existing?.netAmount ?? 0) - received);
      data.shortfallResolved = false; // ยอดค้างใหม่ (ถ้ามี) ยังไม่ถูกทบไปงวดไหน
    } else {
      // ย้อนกลับเป็นรอชำระ — เคลียร์ข้อมูลการรับเงินเดิม
      data.paidAt = null;
      data.receivedAmount = null;
      data.shortfallAmount = 0;
      data.shortfallResolved = false;
    }
  }
  if (note !== undefined) data.note = note;

  const payment = await prisma.creditTermPayment.update({
    where: { id: params.id },
    data,
    include: { branch: true },
  });

  if (status !== undefined) {
    const label = payment.branch?.name ?? payment.label ?? params.id;
    await logActivity({
      staffId: staff.staffId,
      staffName: staff.staffName,
      action: "UPDATE",
      entity: "CreditTermPayment",
      summary:
        status === "PAID"
          ? `ปิดรอบ Credit Term เป็นจ่ายแล้ว — ${label} (รับจริง ${formatBaht(payment.receivedAmount)} บาท)`
          : `ย้อนสถานะ Credit Term เป็นรอชำระ — ${label}`,
    });
  }

  revalidateTag(CREDIT_TERM_CACHE_TAG);
  return NextResponse.json({ payment });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ถ้ารอบนี้เคยทบยอดค้างมาจากงวดก่อน ต้องปลด shortfallResolved ของงวดต้นทางกลับเป็น false ก่อนลบ
  // ไม่งั้นยอดค้างนั้นจะหายไปเฉยๆ (ถูก mark ว่าทบแล้วทั้งที่จริงไม่มีรอบไหนรับช่วงต่อแล้ว)
  const existing = await prisma.creditTermPayment.findUnique({ where: { id: params.id }, include: { branch: true } });
  if (existing?.carriedFromId) {
    await prisma.creditTermPayment.update({ where: { id: existing.carriedFromId }, data: { shortfallResolved: false } });
  }

  await prisma.creditTermPayment.delete({ where: { id: params.id } });
  if (existing) {
    await logActivity({
      staffId: staff.staffId,
      staffName: staff.staffName,
      action: "DELETE",
      entity: "CreditTermPayment",
      summary: `ยกเลิกรอบ Credit Term — ${existing.branch?.name ?? existing.label ?? params.id} (${formatBaht(existing.netAmount)} บาท)`,
    });
  }
  revalidateTag(CREDIT_TERM_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
