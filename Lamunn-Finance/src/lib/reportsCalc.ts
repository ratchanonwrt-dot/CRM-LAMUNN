import { prisma } from "@lamunn/db-finance";

/** ยอดขายรวมทั้งบริษัทรายวัน (ทุกสาขา + E-Commerce กลาง) สำหรับช่วงวันที่ที่กำหนด */
export async function getDailyTotals(start: Date, end: Date): Promise<Map<string, number>> {
  const [salesRows, companyRows] = await Promise.all([
    prisma.dailySales.findMany({
      where: { date: { gte: start, lte: end } },
      include: { branch: { select: { type: true } } },
    }),
    prisma.companyChannelDaily.findMany({ where: { date: { gte: start, lte: end } } }),
  ]);

  const byDate = new Map<string, number>();
  for (const r of salesRows) {
    const storefront = r.branch.type === "CASH" ? (r.cashPos ?? 0) + (r.transfer ?? 0) : r.cashTransferCombined ?? 0;
    const total = storefront + r.grab + r.lineman;
    const key = r.date.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + total);
  }
  for (const c of companyRows) {
    const key = c.date.toISOString().slice(0, 10);
    const ecom = c.tiktok + c.fbLine + c.pickup + c.catering;
    byDate.set(key, (byDate.get(key) ?? 0) + ecom);
  }
  return byDate;
}

export function seriesForRange(dailyTotals: Map<string, number>, start: Date, end: Date): number[] {
  const out: number[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(dailyTotals.get(d.toISOString().slice(0, 10)) ?? 0);
  }
  return out;
}

export function sumMap(m: Map<string, number>): number {
  return Array.from(m.values()).reduce((a, v) => a + v, 0);
}
