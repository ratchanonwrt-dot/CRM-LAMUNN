import { prisma } from "@lamunn/db-finance";
import { computeReceivable, computePeriodsForMonth } from "@lamunn/db-finance";

export async function computePeriodReceivable(branchId: string, periodStart: Date, periodEnd: Date) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { rentConfig: true, creditTermConfig: true } });
  if (!branch) throw new Error("branch not found");

  const agg = await prisma.dailySales.aggregate({
    where: { branchId, date: { gte: periodStart, lte: periodEnd } },
    _sum: { cashTransferCombined: true, grab: true, lineman: true },
  });

  const grossStorefront = agg._sum.cashTransferCombined ?? 0;
  const grossDelivery = (agg._sum.grab ?? 0) + (agg._sum.lineman ?? 0);

  const result = computeReceivable({
    grossStorefront,
    grossDelivery,
    gpPercentStorefront: branch.rentConfig?.gpPercentStorefront ?? 0,
    gpPercentDelivery: branch.rentConfig?.gpPercentDelivery ?? 0,
    vendorFeeMonthly: grossStorefront === 0 && grossDelivery === 0 ? 0 : branch.rentConfig?.vendorFeeMonthly ?? 0,
    deductDeliveryGp: branch.creditTermConfig?.deductDeliveryGp ?? true,
  });

  return { grossStorefront, grossDelivery, ...result };
}

export interface BranchOutstanding {
  branchId: string;
  branchName: string;
  totalOutstanding: number;
  pendingCycles: number;
}

/**
 * ยอด Credit Term ที่ยังค้างอยู่กับห้าง แยกตามสาขา — คิดจากทุกรอบตั้งแต่มีข้อมูลขายจนถึงตอนนี้
 * ไม่ว่าจะกด "ปิดรอบ" ไว้แล้วหรือยัง (รอบที่ยังไม่ปิดจะคำนวณสดจากยอดขายจริง, รอบที่ปิดแล้วและจ่ายแล้วจะไม่นับ)
 */
export async function getPerBranchOutstanding(): Promise<BranchOutstanding[]> {
  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วอาจยังมีเงินค้างรับจากห้างอยู่จริง
  const branches = await prisma.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { creditTermConfig: true },
  });

  const earliest = await prisma.dailySales.aggregate({
    where: { branch: { type: "CREDIT_TERM" } },
    _min: { date: true },
  });

  const now = new Date();
  const start = earliest._min.date ?? now;
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  const endY = now.getUTCFullYear();
  const endM = now.getUTCMonth();

  const results: BranchOutstanding[] = [];

  for (const branch of branches) {
    if (!branch.creditTermConfig) continue;
    let total = 0;
    let cycles = 0;
    let iterY = y;
    let iterM = m;

    while (iterY < endY || (iterY === endY && iterM <= endM)) {
      const periods = computePeriodsForMonth(branch.creditTermConfig, iterY, iterM);
      for (const p of periods) {
        if (p.periodStart > now) continue;
        const existing = await prisma.creditTermPayment.findFirst({
          where: { branchId: branch.id, periodStart: p.periodStart, periodEnd: p.periodEnd },
        });
        if (existing) {
          if (existing.status === "PENDING") {
            total += existing.netAmount;
            cycles += 1;
          }
        } else {
          const computed = await computePeriodReceivable(branch.id, p.periodStart, p.periodEnd);
          if (computed.netAmount > 0) {
            total += computed.netAmount;
            cycles += 1;
          }
        }
      }
      iterM += 1;
      if (iterM > 11) {
        iterM = 0;
        iterY += 1;
      }
    }

    results.push({ branchId: branch.id, branchName: branch.name, totalOutstanding: total, pendingCycles: cycles });
  }

  return results;
}
