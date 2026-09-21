/** พิสูจน์ว่าการแก้ให้เร็วขึ้น "ไม่เปลี่ยนตัวเลขแม้แต่บาทเดียว"
 *
 * วิธี: ดึงข้อมูลด้วยวิธีเดิม (คิวรีชุดเก่า) และวิธีใหม่ (คิวรีชุดใหม่) จากฐานข้อมูลจริง
 * แล้วส่งเข้าตัวคำนวณตัวเดียวกัน จากนั้นเทียบผลลัพธ์ทีละฟิลด์
 *
 * อ่านอย่างเดียว ไม่เขียนอะไรลงฐานข้อมูล
 * รัน: npx tsx scripts/verify-refactor.ts   (จากโฟลเดอร์ Lamunn-Finance)
 */
import { PrismaClient } from "@lamunn/db-finance";
import { computeOutstandingPeriods, type OutstandingInputs } from "../src/lib/creditTermCalc";

const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

let sql = 0;
const counted = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
  datasources: { db: { url: process.env.DATABASE_URL } },
});
counted.$on("query", () => {
  sql++;
});

let failures = 0;
function assertSame(label: string, a: unknown, b: unknown) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  const ok = sa === sb;
  console.log(`  ${ok ? "ตรงกัน  " : "ไม่ตรง ❌"}  ${label}`);
  if (!ok) {
    failures++;
    console.log(`      เดิม: ${sa?.slice(0, 400)}`);
    console.log(`      ใหม่: ${sb?.slice(0, 400)}`);
  }
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number; sql: number }> {
  sql = 0;
  const t = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - t, sql };
}

// ══════════════════════ Credit Term — ยอดค้างรับ ══════════════════════

async function creditTermOld(): Promise<OutstandingInputs> {
  const branches = await counted.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { creditTermConfig: true, rentConfig: true },
  });
  const activeIds = branches.filter((b) => b.creditTermConfig).map((b) => b.id);

  const [earliest, existingPayments, unresolvedShortfalls] = await Promise.all([
    counted.dailySales.aggregate({ where: { branch: { type: "CREDIT_TERM" } }, _min: { date: true } }),
    counted.creditTermPayment.findMany({
      where: { branchId: { in: activeIds } },
      select: {
        id: true, branchId: true, periodStart: true, periodEnd: true, netAmount: true,
        status: true, dueDate: true, receivedAmount: true, shortfallAmount: true, shortfallResolved: true,
      },
    }),
    counted.creditTermPayment.findMany({
      where: { branchId: { in: activeIds }, status: "PAID", shortfallAmount: { gt: 0 }, shortfallResolved: false },
      select: { branchId: true, periodEnd: true, shortfallAmount: true },
    }),
  ]);

  const now = new Date();
  const start = earliest._min.date ?? now;
  const dailyRows = await counted.dailySales.findMany({
    where: { branchId: { in: activeIds }, date: { gte: start, lte: now } },
    select: { branchId: true, date: true, cashTransferCombined: true, grab: true, lineman: true },
  });

  // เช็คด้วยว่า "ยอดค้างที่ยังไม่ถูกทบ" ที่กรองในหน่วยความจำ ให้ผลเท่ากับที่ฐานข้อมูลกรองให้
  const derived = existingPayments
    .filter((p) => p.status === "PAID" && p.shortfallAmount > 0 && !p.shortfallResolved)
    .map((p) => ({ branchId: p.branchId, periodEnd: p.periodEnd, shortfallAmount: p.shortfallAmount }));
  assertSame(
    "ยอดค้างที่ยังไม่ถูกทบ (ฐานข้อมูลกรอง vs กรองในหน่วยความจำ)",
    [...unresolvedShortfalls].sort((a, b) => String(a.branchId).localeCompare(String(b.branchId))),
    [...derived].sort((a, b) => String(a.branchId).localeCompare(String(b.branchId)))
  );

  return { earliestSaleDate: earliest._min.date, existingPayments, dailyRows };
}

async function creditTermNew(): Promise<OutstandingInputs> {
  const branches = await counted.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { creditTermConfig: true, rentConfig: true },
  });
  const allIds = branches.map((b) => b.id);
  const activeIds = branches.filter((b) => b.creditTermConfig).map((b) => b.id);

  const [existingPayments, dailyRows] = await Promise.all([
    counted.creditTermPayment.findMany({
      where: { branchId: { in: activeIds } },
      select: {
        id: true, branchId: true, periodStart: true, periodEnd: true, netAmount: true,
        status: true, dueDate: true, receivedAmount: true, shortfallAmount: true, shortfallResolved: true,
      },
    }),
    counted.dailySales.findMany({
      where: { branchId: { in: allIds } },
      select: { branchId: true, date: true, cashTransferCombined: true, grab: true, lineman: true },
    }),
  ]);

  let earliestSaleDate: Date | null = null;
  for (const r of dailyRows) if (!earliestSaleDate || r.date < earliestSaleDate) earliestSaleDate = r.date;

  return { earliestSaleDate, existingPayments, dailyRows };
}

// ══════════════════════ สถานะเงินสด ══════════════════════

interface CashOutput {
  balance: number;
  openingBalance: number;
  rows: { date: string; today: number; adjustment: number; adjustmentLabels: string[]; running: number }[];
  recentAdjustments: { date: string; amount: number; label: string }[];
}

function buildCashOutput(
  openingBalance: number,
  openingDate: Date,
  start: Date,
  clampedEnd: Date,
  totalSalesAfterOpening: number,
  totalAdjAfterOpening: number,
  prefixSales: number,
  prefixAdj: number,
  recent: { date: Date; amount: number; label: string }[],
  dailyByDate: Map<string, number>,
  monthAdjustments: { date: Date; amount: number; label: string }[]
): CashOutput {
  const balance = openingBalance + totalSalesAfterOpening + totalAdjAfterOpening;
  let running = openingBalance + prefixSales + prefixAdj;

  const adjMap = new Map<string, { total: number; labels: string[] }>();
  for (const a of monthAdjustments) {
    const key = a.date.toISOString().slice(0, 10);
    const existing = adjMap.get(key) ?? { total: 0, labels: [] };
    existing.total += a.amount;
    existing.labels.push(a.label);
    adjMap.set(key, existing);
  }

  const rows: CashOutput["rows"] = [];
  for (let d = new Date(start); d <= clampedEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const today = dailyByDate.get(key) ?? 0;
    const adj = adjMap.get(key);
    running += today + (adj?.total ?? 0);
    rows.push({ date: key, today, adjustment: adj?.total ?? 0, adjustmentLabels: adj?.labels ?? [], running });
  }

  return {
    balance,
    openingBalance,
    rows,
    recentAdjustments: recent.map((a) => ({ date: a.date.toISOString().slice(0, 10), amount: a.amount, label: a.label })),
  };
}

async function cashOld(openingBalance: number, openingDate: Date, start: Date, clampedEnd: Date): Promise<CashOutput> {
  const cashBranches = await counted.branch.findMany({ where: { type: "CASH" }, select: { id: true } });
  const ids = cashBranches.map((b) => b.id);

  const [salesAgg, adjAgg, prefixSalesAgg, prefixAdjAgg, recent, daily, monthAdjustments] = await Promise.all([
    counted.dailySales.aggregate({ where: { branchId: { in: ids }, date: { gt: openingDate } }, _sum: { cashCounted: true } }),
    counted.cashAdjustment.aggregate({ where: { date: { gt: openingDate } }, _sum: { amount: true } }),
    counted.dailySales.aggregate({ where: { branchId: { in: ids }, date: { gt: openingDate, lt: start } }, _sum: { cashCounted: true } }),
    counted.cashAdjustment.aggregate({ where: { date: { gt: openingDate, lt: start } }, _sum: { amount: true } }),
    counted.cashAdjustment.findMany({ orderBy: { date: "desc" }, take: 30 }),
    counted.dailySales.groupBy({ by: ["date"], where: { branchId: { in: ids }, date: { gte: start, lte: clampedEnd } }, _sum: { cashCounted: true } }),
    counted.cashAdjustment.findMany({ where: { date: { gte: start, lte: clampedEnd } } }),
  ]);

  return buildCashOutput(
    openingBalance, openingDate, start, clampedEnd,
    salesAgg._sum.cashCounted ?? 0,
    adjAgg._sum.amount ?? 0,
    prefixSalesAgg._sum.cashCounted ?? 0,
    prefixAdjAgg._sum.amount ?? 0,
    recent,
    new Map(daily.map((d) => [d.date.toISOString().slice(0, 10), d._sum.cashCounted ?? 0])),
    monthAdjustments
  );
}

async function cashNew(openingBalance: number, openingDate: Date, start: Date, clampedEnd: Date): Promise<CashOutput> {
  const cashBranches = await counted.branch.findMany({ where: { type: "CASH" }, select: { id: true } });
  const ids = cashBranches.map((b) => b.id);

  // 2 คิวรี: ยอดเงินสดรายวันทุกวัน (ตารางนี้มีไม่กี่ร้อยวัน) + รายการปรับปรุงทั้งหมด (มีไม่กี่แถว)
  const [dailyAll, adjustmentsAll] = await Promise.all([
    counted.dailySales.groupBy({ by: ["date"], where: { branchId: { in: ids } }, _sum: { cashCounted: true } }),
    counted.cashAdjustment.findMany({ orderBy: { date: "desc" } }),
  ]);

  let totalSalesAfterOpening = 0;
  let prefixSales = 0;
  const dailyByDate = new Map<string, number>();
  for (const d of dailyAll) {
    const v = d._sum.cashCounted ?? 0;
    if (d.date > openingDate) totalSalesAfterOpening += v;
    if (d.date > openingDate && d.date < start) prefixSales += v;
    if (d.date >= start && d.date <= clampedEnd) dailyByDate.set(d.date.toISOString().slice(0, 10), v);
  }

  let totalAdjAfterOpening = 0;
  let prefixAdj = 0;
  const monthAdjustments: typeof adjustmentsAll = [];
  for (const a of adjustmentsAll) {
    if (a.date > openingDate) totalAdjAfterOpening += a.amount;
    if (a.date > openingDate && a.date < start) prefixAdj += a.amount;
    if (a.date >= start && a.date <= clampedEnd) monthAdjustments.push(a);
  }

  return buildCashOutput(
    openingBalance, openingDate, start, clampedEnd,
    totalSalesAfterOpening, totalAdjAfterOpening, prefixSales, prefixAdj,
    adjustmentsAll.slice(0, 30),
    dailyByDate,
    monthAdjustments
  );
}

// ══════════════════════ main ══════════════════════

async function main() {
  console.log("\n════ Credit Term — ยอดค้างรับจากห้าง ════");
  const branches = await prisma.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { creditTermConfig: true, rentConfig: true },
  });

  const oldRun = await timed("old", creditTermOld);
  const newRun = await timed("new", creditTermNew);
  console.log(`  วิธีเดิม: ${oldRun.ms} ms, SQL ${oldRun.sql} ตัว`);
  console.log(`  วิธีใหม่: ${newRun.ms} ms, SQL ${newRun.sql} ตัว`);

  const oldPeriods = computeOutstandingPeriods(branches, oldRun.result);
  const newPeriods = computeOutstandingPeriods(branches, newRun.result);
  console.log(`  จำนวนงวดค้างที่คำนวณได้: เดิม ${oldPeriods.length} งวด / ใหม่ ${newPeriods.length} งวด`);
  assertSame("รายการงวดค้างทั้งหมด (ทุกฟิลด์ ทุกงวด)", oldPeriods, newPeriods);
  const sum = (ps: typeof oldPeriods) => ps.reduce((a, p) => a + p.netAmount, 0);
  assertSame("ยอดค้างรับรวม (บาท)", sum(oldPeriods).toFixed(2), sum(newPeriods).toFixed(2));

  console.log("\n════ สถานะเงินสด ════");
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const openingBalance = Number(map.cashOpeningBalance ?? "0");
  const [oy, om, od] = (map.cashOpeningDate ?? "1970-01-01").split("-").map(Number);
  const openingDate = new Date(Date.UTC(oy, om - 1, od));

  const now = new Date();
  for (const back of [0, 1, 2]) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - back;
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 0));
    const clampedEnd = end > now ? now : end;

    const o = await timed("old", () => cashOld(openingBalance, openingDate, start, clampedEnd));
    const n = await timed("new", () => cashNew(openingBalance, openingDate, start, clampedEnd));
    console.log(`  เดือน ${start.toISOString().slice(0, 7)} — เดิม ${o.ms} ms/SQL ${o.sql} · ใหม่ ${n.ms} ms/SQL ${n.sql}`);
    assertSame(`เดือน ${start.toISOString().slice(0, 7)} — ยอดทุกช่อง (คงเหลือ/รายวัน/สะสม/ปรับปรุง)`, o.result, n.result);
  }

  console.log(failures === 0 ? "\n✅ ผลลัพธ์ตรงกันทุกตัวเลข — ปลอดภัยที่จะใช้วิธีใหม่\n" : `\n❌ ไม่ตรงกัน ${failures} จุด — ห้ามใช้วิธีใหม่\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
