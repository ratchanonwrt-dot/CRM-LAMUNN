import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { checkPayoutKey } from "@/lib/payoutSecret";
import { optionalText } from "@/lib/validation";

/**
 * สำหรับเว็บ Finance — ต้องส่ง header x-payout-key
 * POST body: { paid: true, paidBy?, paidRef? }  → ทำจ่ายแล้ว
 *            { paid: false }                    → ถอนสถานะจ่าย (กลับเป็นอนุมัติแล้ว)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!checkPayoutKey(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = await prisma.dailyPayout.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  const paid = body.paid !== false;
  const updated = await prisma.dailyPayout.update({
    where: { id: params.id },
    data: paid
      ? { status: "PAID", paidAt: new Date(), paidBy: optionalText(body.paidBy), paidRef: optionalText(body.paidRef) }
      : { status: "APPROVED", paidAt: null, paidBy: null, paidRef: null },
  });
  return NextResponse.json({ ok: true, status: updated.status, paidAt: updated.paidAt?.toISOString() ?? null });
}
