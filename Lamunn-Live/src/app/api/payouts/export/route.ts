import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { checkPayoutKey } from "@/lib/payoutSecret";
import { computeDailyPayouts, parseIsoDate } from "@/lib/payouts";
import { addDays, isoDate, todayTH } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/**
 * สำหรับเว็บ Finance (บัญชี) — ต้องส่ง header x-payout-key
 * GET ?from&to&status=APPROVED|PAID|ALL — คืนเฉพาะรายการที่แอดมิน Live อนุมัติแล้ว (snapshot) พร้อมชื่อ/บัญชีรับเงิน
 */
export async function GET(req: NextRequest) {
  if (!checkPayoutKey(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const today = todayTH();
  const from = parseIsoDate(req.nextUrl.searchParams.get("from")) ?? addDays(today, -30);
  const to = parseIsoDate(req.nextUrl.searchParams.get("to")) ?? today;
  const statusParam = req.nextUrl.searchParams.get("status") ?? "ALL";
  const status = statusParam === "APPROVED" || statusParam === "PAID" ? (statusParam as "APPROVED" | "PAID") : null;
  const where = { date: { gte: from, lte: to }, ...(status ? { status } : {}) };

  const [rows, live] = await Promise.all([
    prisma.dailyPayout.findMany({ where, include: { streamer: { select: { name: true, nickname: true, hrEmployeeId: true } }, approvedBy: { select: { name: true } } }, orderBy: [{ date: "desc" }, { payeeName: "asc" }] }),
    computeDailyPayouts(from, to),
  ]);
  const changedIds = new Set(live.filter((r) => r.id && r.changed).map((r) => r.id!));

  return NextResponse.json({
    from: isoDate(from),
    to: isoDate(to),
    rows: rows.map((r) => ({
      id: r.id,
      date: isoDate(r.date),
      streamerName: r.streamer.name,
      nickname: r.streamer.nickname,
      hrEmployeeId: r.streamer.hrEmployeeId,
      payeeName: r.payeeName,
      bankName: r.bankName,
      bankAccountNo: r.bankAccountNo,
      hours: r.hours,
      sales: r.sales,
      shiftCount: r.shiftCount,
      amount: r.amount,
      note: r.note,
      status: r.status,
      approvedBy: r.approvedBy?.name ?? null,
      approvedAt: r.approvedAt.toISOString(),
      paidAt: r.paidAt?.toISOString() ?? null,
      paidBy: r.paidBy,
      paidRef: r.paidRef,
      stale: changedIds.has(r.id), // ยอดในระบบ Live เปลี่ยนหลังอนุมัติ — รอแอดมินอนุมัติใหม่
    })),
  });
}
