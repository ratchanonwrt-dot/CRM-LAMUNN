/** เทียบความเร็วหน้า "รายงาน/วิเคราะห์" ก่อน-หลังแก้ (อ่านอย่างเดียว ไม่เขียนอะไรลงฐานข้อมูล)
 *
 * รัน: npx tsx scripts/bench-reports.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { prisma } from "@lamunn/db-finance";
import { loadAllSalesData, dailyTotalsFrom, sliceMap, aggregateByBranch, sumMap } from "../src/lib/reportsCalc";

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;
const start = new Date(Date.UTC(year, month - 1, 1));
const end = new Date(Date.UTC(year, month, 0));
const clampedEnd = end > now ? now : end;
const lastStart = new Date(Date.UTC(year, month - 2, 1));
const lastEnd = new Date(Date.UTC(year, month - 1, 0));
const yearStart = new Date(Date.UTC(year, 0, 1));
const lastYearStart = new Date(Date.UTC(year - 1, 0, 1));
const lastYearEnd = new Date(Date.UTC(year - 1, month, 0));

const SUM = { cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true } as const;

/** วิธีเดิม: ยิงคิวรีแยกทุกช่วง เรียงต่อกันเป็นชั้น ๆ */
async function oldWay() {
  const dailyTotals = async (s: Date, e: Date) => {
    await Promise.all([
      prisma.dailySales.findMany({
        where: { date: { gte: s, lte: e } },
        select: { date: true, cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true, branch: { select: { type: true } } },
      }),
      prisma.companyChannelDaily.findMany({ where: { date: { gte: s, lte: e } }, select: { date: true, tiktok: true, fbLine: true, pickup: true, catering: true } }),
    ]);
  };

  await Promise.all([dailyTotals(start, clampedEnd), dailyTotals(lastStart, lastEnd)]);
  await dailyTotals(lastStart, lastEnd);
  await Promise.all([dailyTotals(new Date(now.getTime() - 6 * 86400000), now), dailyTotals(new Date(now.getTime() - 13 * 86400000), new Date(now.getTime() - 7 * 86400000))]);
  await Promise.all([dailyTotals(yearStart, clampedEnd), dailyTotals(lastYearStart, lastYearEnd)]);
  await prisma.branch.findMany({ select: { id: true, name: true, type: true, isActive: true } });
  await Promise.all([
    prisma.dailySales.groupBy({ by: ["branchId"], where: { date: { gte: start, lte: clampedEnd } }, _sum: SUM }),
    prisma.dailySales.groupBy({ by: ["branchId"], where: { date: { gte: lastStart, lte: lastEnd } }, _sum: SUM }),
    prisma.dailySales.findMany({
      select: { branchId: true, date: true, cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true },
      orderBy: { date: "asc" },
    }),
  ]);
  await Promise.all([
    prisma.dailySales.groupBy({ by: ["branchId"], where: { date: { gte: yearStart, lte: clampedEnd } }, _sum: SUM }),
    prisma.dailySales.groupBy({ by: ["branchId"], where: { date: { gte: lastYearStart, lte: lastYearEnd } }, _sum: SUM }),
  ]);
  await Promise.all([
    prisma.dailySales.aggregate({ where: { date: { gte: start, lte: clampedEnd }, branch: { type: "CASH" } }, _sum: { cashPos: true, transfer: true } }),
    prisma.dailySales.aggregate({ where: { date: { gte: start, lte: clampedEnd }, branch: { type: "CREDIT_TERM" } }, _sum: { cashTransferCombined: true } }),
    prisma.dailySales.aggregate({ where: { date: { gte: start, lte: clampedEnd } }, _sum: { grab: true, lineman: true } }),
    prisma.companyChannelDaily.aggregate({ where: { date: { gte: start, lte: clampedEnd } }, _sum: { tiktok: true, fbLine: true, pickup: true, catering: true } }),
  ]);
}

/** วิธีใหม่: โหลดครั้งเดียว 3 คิวรีขนาน แล้วคำนวณทุกช่วงในหน่วยความจำ */
async function newWay() {
  const { branches, salesRows, companyRows } = await loadAllSalesData();
  const branchTypeMap = new Map(branches.map((b) => [b.id, b.type]));
  const dailyAll = dailyTotalsFrom(salesRows, companyRows, branchTypeMap);

  sumMap(sliceMap(dailyAll, start, clampedEnd));
  sumMap(sliceMap(dailyAll, lastStart, lastEnd));
  sumMap(sliceMap(dailyAll, new Date(now.getTime() - 6 * 86400000), now));
  sumMap(sliceMap(dailyAll, new Date(now.getTime() - 13 * 86400000), new Date(now.getTime() - 7 * 86400000)));
  sumMap(sliceMap(dailyAll, yearStart, clampedEnd));
  sumMap(sliceMap(dailyAll, lastYearStart, lastYearEnd));
  aggregateByBranch(salesRows, start, clampedEnd);
  aggregateByBranch(salesRows, lastStart, lastEnd);
  aggregateByBranch(salesRows, yearStart, clampedEnd);
  aggregateByBranch(salesRows, lastYearStart, lastYearEnd);
}

async function bench(label: string, fn: () => Promise<void>, runs = 3) {
  await fn(); // warm-up ไม่นับ
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const t = Date.now();
    await fn();
    times.push(Date.now() - t);
  }
  times.sort((a, b) => a - b);
  console.log(`  ${String(times[Math.floor(runs / 2)]).padStart(6)} ms  ${label}   (ทุกครั้ง: ${times.join(", ")} ms)`);
  return times[Math.floor(runs / 2)];
}

async function main() {
  const t = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const rtt = Date.now() - t;
  console.log(`\nเวลาไป-กลับฐานข้อมูล 1 คิวรีจากเครื่องนี้: ~${rtt} ms (บน Vercel region sin1 จะเหลือ ~1-3 ms)\n`);

  console.log("=== หน้า รายงาน/วิเคราะห์ ===");
  const oldMs = await bench("แบบเดิม  (~20 คิวรี เรียงต่อกัน 9 ชั้น)", oldWay);
  const newMs = await bench("แบบใหม่  (3 คิวรีขนาน ชั้นเดียว)", newWay);

  console.log(`\n  เร็วขึ้น ${(oldMs / newMs).toFixed(1)} เท่า — ประหยัดไป ${oldMs - newMs} ms จากเครื่องนี้`);
  console.log(`  จำนวนชั้นที่ต้องรอ: 9 ชั้น -> 1 ชั้น (นี่คือส่วนที่ไม่หายไปแม้ latency จะต่ำลงบน Vercel)\n`);
}

main().then(() => process.exit(0));
