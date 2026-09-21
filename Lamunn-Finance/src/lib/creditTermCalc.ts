import { unstable_cache } from "next/cache";
import { getCreditTermBranchesCached } from "./branchCache";
import { prisma } from "@lamunn/db-finance";
import { computeReceivable, computePeriodsForMonth } from "@lamunn/db-finance";

export interface CarriedShortfall {
  fromPaymentId: string;
  amount: number;
}

/**
 * หายอดค้างจากงวดก่อนหน้าของสาขานี้ที่ยัง "ไม่ถูกทบ" เข้ารอบไหนเลย (shortfallResolved = false)
 * ใช้แค่ "อ่าน" เพื่อพรีวิว/คำนวณยอดที่ต้องรับ — การ mark ว่า resolved จริง ทำที่ตอน "ปิดรอบ"
 * (/api/credit-term/generate) เท่านั้น เพื่อไม่ให้พรีวิวมี side effect
 */
export async function getUnresolvedShortfall(branchId: string, beforePeriodStart: Date): Promise<CarriedShortfall | null> {
  const prior = await prisma.creditTermPayment.findFirst({
    where: {
      branchId,
      status: "PAID",
      shortfallAmount: { gt: 0 },
      shortfallResolved: false,
      periodEnd: { lt: beforePeriodStart },
    },
    orderBy: { periodEnd: "desc" },
  });
  if (!prior) return null;
  return { fromPaymentId: prior.id, amount: prior.shortfallAmount };
}

/**
 * เหมือน getUnresolvedShortfall แต่ดึงของ "หลายสาขาพร้อมกันในคำถามเดียว" แทนที่จะยิง findFirst
 * แยกทุกสาขา — ใช้กับหน้าที่มีการ์ดหลายสาขาพร้อมกัน (เช่น credit-term/page.tsx) เพราะยิง N คำถาม
 * พร้อมกันแบบ Promise.all ไปชนกับ connection pool ของ pgbouncer ทำให้คิวรอกันเองจนช้ามาก
 */
export async function getUnresolvedShortfallsByBranch(
  branchIds: string[]
): Promise<Map<string, { id: string; periodEnd: Date; shortfallAmount: number }[]>> {
  const map = new Map<string, { id: string; periodEnd: Date; shortfallAmount: number }[]>();
  if (branchIds.length === 0) return map;
  const rows = await prisma.creditTermPayment.findMany({
    where: { branchId: { in: branchIds }, status: "PAID", shortfallAmount: { gt: 0 }, shortfallResolved: false },
    select: { id: true, branchId: true, periodEnd: true, shortfallAmount: true },
  });
  for (const r of rows) {
    if (!r.branchId) continue;
    const list = map.get(r.branchId) ?? [];
    list.push({ id: r.id, periodEnd: r.periodEnd!, shortfallAmount: r.shortfallAmount });
    map.set(r.branchId, list);
  }
  for (const list of map.values()) list.sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime());
  return map;
}

// สำคัญ: splice ก้อนที่เคลมออกจาก list ทันที (ไม่ใช่แค่ .find) — ผู้เรียกต้องวนเรียกตามลำดับงวดจากเก่าไปใหม่
// ของแต่ละสาขา ไม่งั้นยอดค้างก้อนเดียวจะถูกทบเข้างวดถัดไปหลายงวดพร้อมกัน (เจอบั๊กจริง: งวด 1-15 กับ 16-สิ้นเดือน
// ของเดือนถัดไปเห็นยอดค้างเดียวกันซ้ำทั้งคู่ ทำให้ยอดรวมพองเกินจริงไปเท่าตัว)
export function pickUnresolvedShortfall(
  shortfallsByBranch: Map<string, { id: string; periodEnd: Date; shortfallAmount: number }[]>,
  branchId: string,
  beforePeriodStart: Date
): CarriedShortfall | null {
  const list = shortfallsByBranch.get(branchId);
  if (!list) return null;
  const idx = list.findIndex((s) => s.periodEnd < beforePeriodStart);
  if (idx === -1) return null;
  const [found] = list.splice(idx, 1);
  return { fromPaymentId: found.id, amount: found.shortfallAmount };
}

export async function computePeriodReceivable(branchId: string, periodStart: Date, periodEnd: Date) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId }, include: { rentConfig: true, creditTermConfig: true } });
  if (!branch) throw new Error("branch not found");
  return computePeriodReceivableWithBranch(branch, periodStart, periodEnd);
}

async function computePeriodReceivableWithBranch(branch: { id: string; rentConfig: any; creditTermConfig: any }, periodStart: Date, periodEnd: Date) {
  const branchId = branch.id;
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

  const carried = await getUnresolvedShortfall(branchId, periodStart);
  const carriedInAmount = carried?.amount ?? 0;

  return {
    grossStorefront,
    grossDelivery,
    ...result,
    rawNetAmount: result.netAmount,
    netAmount: result.netAmount + carriedInAmount,
    carriedInAmount,
    carriedFromPaymentId: carried?.fromPaymentId ?? null,
  };
}

export interface BranchOutstanding {
  branchId: string;
  branchName: string;
  totalOutstanding: number;
  pendingCycles: number;
}

export interface OutstandingPeriod {
  branchId: string;
  branchName: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  netAmount: number;
  // ถ้ารอบนี้เคยกด "ปิดรอบ" ไว้แล้ว จะมี id/status ให้กดอัปเดตสถานะได้ตรงนี้เลย — ถ้าเป็น null แปลว่ายังไม่เคยปิดรอบ
  // (คำนวณสดอย่างเดียว) ต้องกด "ปิดรอบ" ก่อนถึงจะบันทึกยอดที่ได้รับได้
  existingId: string | null;
  status: "PENDING" | "PAID" | null;
  receivedAmount: number | null;
  shortfallAmount: number;
}

/**
 * รวบรวมทุกรอบที่ยังค้างรับจากห้าง (ทั้งที่เคยปิดรอบแล้วสถานะ PENDING และรอบที่ยังไม่ปิดรอบเลยคำนวณสด)
 * ตั้งแต่มีข้อมูลขายจนถึงตอนนี้ — เป็น query แบบ batch (ไม่ query แยกทุกรอบ) ให้ getPerBranchOutstanding
 * และ getOutstandingByDueDate ใช้ข้อมูลชุดเดียวกัน ไม่ต้องคำนวณซ้ำ
 */
// ไม่กรอง isActive — สาขาที่ปิดไปแล้วอาจยังมีเงินค้างรับจากห้างอยู่จริง — export ไว้ให้หน้าที่ต้อง query
// สาขา CREDIT_TERM แบบเดียวกันอยู่แล้ว (เช่น credit-term/page.tsx) เรียกครั้งเดียวแล้วส่งต่อให้
// collectOutstandingPeriods แทนที่จะ query ซ้ำสอง — แต่ละ round-trip ไป DB มีต้นทุนคงที่ค่อนข้างสูงบน
// deployment นี้ (วัดจริง ~2-2.5 วินาทีต่อรอบไม่ว่าคำถามจะซับซ้อนแค่ไหน) ตัดรอบซ้ำได้เท่าไหร่คือเร็วขึ้นเท่านั้น
export async function fetchCreditTermBranches() {
  // อ่านจากแคช — คิวรีนี้แตกเป็น 6 SQL statement ต่อครั้ง (branch + include 2 ชั้น + transaction)
  // และถูกเรียกหลายรอบต่อการเปิดหน้า 1 ครั้ง แต่ข้อมูลแทบไม่เคยเปลี่ยน (ดู lib/branchCache.ts)
  return getCreditTermBranchesCached();
}

/** ข้อมูลดิบทั้งหมดที่การคำนวณยอดค้างต้องใช้ — แยกจากตัวคำนวณเพื่อให้เปลี่ยนวิธีดึงได้
 * โดยไม่แตะตรรกะการคำนวณเลย (และพิสูจน์ได้ว่าผลลัพธ์เท่าเดิม ดู scripts/verify-refactor.ts) */
export interface OutstandingInputs {
  /** วันแรกสุดที่มียอดขายของสาขา CREDIT_TERM ทั้งหมด (null = ยังไม่มียอดขายเลย) */
  earliestSaleDate: Date | null;
  existingPayments: {
    id: string;
    branchId: string | null;
    periodStart: Date | null;
    periodEnd: Date | null;
    netAmount: number;
    status: string;
    dueDate: Date;
    receivedAmount: number | null;
    shortfallAmount: number;
    shortfallResolved: boolean;
  }[];
  dailyRows: { branchId: string; date: Date; cashTransferCombined: number | null; grab: number; lineman: number }[];
}

/** ดึงข้อมูลดิบ — 2 คิวรีขนานชั้นเดียว
 *
 * เดิมเป็น 4 คิวรี 2 ชั้น เพราะคิวรียอดขายดิบต้องรอผล _min(date) ก่อนถึงจะรู้ว่าเริ่มดึงจากวันไหน
 * ตอนนี้ดึงยอดขายของสาขา CREDIT_TERM ทั้งหมดมาเลย (ตารางมีไม่กี่พันแถว) แล้วหาวันแรกสุดในหน่วยความจำ
 * ส่วน "ยอดค้างที่ยังไม่ถูกทบ" ก็เป็นส่วนย่อยของรายการปิดรอบที่ดึงมาแล้ว กรองเอาเองได้ ไม่ต้องยิงซ้ำ */
async function fetchOutstandingInputs(allCreditTermBranchIds: string[], activeBranchIds: string[]): Promise<OutstandingInputs> {
  const [existingPayments, dailyRows] = await Promise.all([
    prisma.creditTermPayment.findMany({
      where: { branchId: { in: activeBranchIds } },
      select: {
        id: true, branchId: true, periodStart: true, periodEnd: true, netAmount: true,
        status: true, dueDate: true, receivedAmount: true, shortfallAmount: true, shortfallResolved: true,
      },
    }),
    prisma.dailySales.findMany({
      where: { branchId: { in: allCreditTermBranchIds } },
      select: { branchId: true, date: true, cashTransferCombined: true, grab: true, lineman: true },
    }),
  ]);

  let earliestSaleDate: Date | null = null;
  for (const r of dailyRows) {
    if (!earliestSaleDate || r.date < earliestSaleDate) earliestSaleDate = r.date;
  }

  return { earliestSaleDate, existingPayments, dailyRows };
}

async function collectOutstandingPeriodsUncached(
  preloadedBranches?: Awaited<ReturnType<typeof fetchCreditTermBranches>>
): Promise<OutstandingPeriod[]> {
  const branches = preloadedBranches ?? (await fetchCreditTermBranches());
  const activeBranches = branches.filter((b) => b.creditTermConfig);
  if (activeBranches.length === 0) return [];

  const inputs = await fetchOutstandingInputs(
    branches.map((b) => b.id),
    activeBranches.map((b) => b.id)
  );
  return computeOutstandingPeriods(branches, inputs);
}

/** ตรรกะการคำนวณยอดค้างทั้งหมด — ฟังก์ชันบริสุทธิ์ ไม่แตะฐานข้อมูล
 * (ยกมาจากโค้ดเดิมทั้งดุ้น เปลี่ยนแค่ที่มาของข้อมูลนำเข้า) */
export function computeOutstandingPeriods(
  branches: Awaited<ReturnType<typeof fetchCreditTermBranches>>,
  inputs: OutstandingInputs
): OutstandingPeriod[] {
  const activeBranches = branches.filter((b) => b.creditTermConfig);
  if (activeBranches.length === 0) return [];

  const { existingPayments } = inputs;
  const unresolvedShortfalls = existingPayments.filter(
    (p) => p.status === "PAID" && p.shortfallAmount > 0 && !p.shortfallResolved
  );

  const now = new Date();
  const start = inputs.earliestSaleDate ?? now;
  let y = start.getUTCFullYear();
  let m = start.getUTCMonth();
  const endY = now.getUTCFullYear();
  const endM = now.getUTCMonth();

  const existingMap = new Map(
    existingPayments.map((p) => [`${p.branchId}_${p.periodStart!.toISOString()}_${p.periodEnd!.toISOString()}`, p])
  );

  // รวมยอดขายดิบเป็นรายวันในหน่วยความจำ — กรองช่วงวันที่แบบเดียวกับคิวรีเดิม (date >= start && date <= now)
  const dailyByBranch = new Map<string, { date: Date; storefront: number; delivery: number }[]>();
  for (const r of inputs.dailyRows) {
    if (r.date < start || r.date > now) continue;
    const list = dailyByBranch.get(r.branchId) ?? [];
    list.push({ date: r.date, storefront: r.cashTransferCombined ?? 0, delivery: (r.grab ?? 0) + (r.lineman ?? 0) });
    dailyByBranch.set(r.branchId, list);
  }

  function sumRange(branchId: string, periodStart: Date, periodEnd: Date) {
    const rows = dailyByBranch.get(branchId) ?? [];
    let grossStorefront = 0;
    let grossDelivery = 0;
    for (const r of rows) {
      if (r.date >= periodStart && r.date <= periodEnd) {
        grossStorefront += r.storefront;
        grossDelivery += r.delivery;
      }
    }
    return { grossStorefront, grossDelivery };
  }

  const outstanding: OutstandingPeriod[] = [];

  for (const branch of activeBranches) {
    let iterY = y;
    let iterM = m;

    // ยอดค้างล่าสุดของสาขานี้ที่ยังไม่ถูกทบไปงวดไหน (ถ้ามี) — เอาไว้บวกเข้ารอบแรกสุดหลังจากงวดที่ค้างนั้น
    // (mutable — ถูก splice ออกทันทีที่มีงวดไหน "รับ" ไปแล้ว กันไม่ให้งวดถัดๆ ไปที่ยังไม่ปิดรอบเห็นยอดค้างก้อนเดียวกันซ้ำ
    // ทุกงวด จนยอดรวมพองเกินจริง — บั๊กที่เจอจริง: ยอดค้างก้อนเดียวถูกนับซ้ำในทั้งงวดถัดไปและงวดถัดไปอีกที)
    const branchShortfalls = unresolvedShortfalls
      .filter((s) => s.branchId === branch.id)
      .sort((a, b) => b.periodEnd!.getTime() - a.periodEnd!.getTime());

    while (iterY < endY || (iterY === endY && iterM <= endM)) {
      const periods = computePeriodsForMonth(branch.creditTermConfig!, iterY, iterM);
      for (const p of periods) {
        if (p.periodStart > now) continue;
        const existing = existingMap.get(`${branch.id}_${p.periodStart.toISOString()}_${p.periodEnd.toISOString()}`);
        if (existing) {
          if (existing.status === "PENDING") {
            outstanding.push({
              branchId: branch.id,
              branchName: branch.name,
              periodStart: p.periodStart,
              periodEnd: p.periodEnd,
              dueDate: existing.dueDate,
              netAmount: existing.netAmount,
              existingId: existing.id,
              status: existing.status,
              receivedAmount: existing.receivedAmount,
              shortfallAmount: existing.shortfallAmount,
            });
          }
          continue;
        }

        const { grossStorefront, grossDelivery } = sumRange(branch.id, p.periodStart, p.periodEnd);
        const claimIdx = branchShortfalls.findIndex((s) => s.periodEnd! < p.periodStart);
        const carriedInAmount = claimIdx === -1 ? 0 : branchShortfalls[claimIdx].shortfallAmount;
        if (claimIdx !== -1) branchShortfalls.splice(claimIdx, 1); // เคลมแล้วตัดออก กันงวดถัดไปเห็นซ้ำ
        if (grossStorefront === 0 && grossDelivery === 0 && carriedInAmount === 0) continue;

        const result = computeReceivable({
          grossStorefront,
          grossDelivery,
          gpPercentStorefront: branch.rentConfig?.gpPercentStorefront ?? 0,
          gpPercentDelivery: branch.rentConfig?.gpPercentDelivery ?? 0,
          vendorFeeMonthly: grossStorefront === 0 && grossDelivery === 0 ? 0 : branch.rentConfig?.vendorFeeMonthly ?? 0,
          deductDeliveryGp: branch.creditTermConfig?.deductDeliveryGp ?? true,
        });
        const netAmount = result.netAmount + carriedInAmount;
        if (netAmount > 0) {
          outstanding.push({
            branchId: branch.id,
            branchName: branch.name,
            periodStart: p.periodStart,
            periodEnd: p.periodEnd,
            dueDate: p.dueDate,
            netAmount,
            existingId: null,
            status: null,
            receivedAmount: null,
            shortfallAmount: 0,
          });
        }
      }
      iterM += 1;
      if (iterM > 11) {
        iterM = 0;
        iterY += 1;
      }
    }
  }

  return outstanding;
}

// cache ไว้สั้นๆ (20 วิ) เฉพาะกรณีที่ไม่มี preloadedBranches ส่งมา (เคสมี preload คือหน้าที่ query สาขา
// เองอยู่แล้วเพื่อใช้งานอย่างอื่นด้วย ไม่ได้ประโยชน์จาก cache นี้เท่าไหร่) — ฟังก์ชันนี้เป็นจุดที่หนักที่สุด
// ของระบบ (คำนวณยอดค้างรับทุกสาขาย้อนหลังทั้งหมด) และถูกเรียกจากหลายหน้า (credit-term, dashboard,
// company-status) การ cache ไว้ช่วยเคสที่มีคนเปิดหลายหน้าพร้อมกันได้มาก โดยยอมรับว่าตัวเลขอาจไม่ใหม่สุด
// ในกรอบ ~20 วินาที (พนักงานกดปิดรอบแล้วรีเฟรชทันทีอาจยังไม่เห็นการเปลี่ยนแปลง ต้องรอ cache หมดอายุ)
//
// unstable_cache ไม่เก็บ Date object จริง — ได้ค่ากลับมาเป็น string ธรรมดา (เจอบั๊กจริงตอนทดสอบ:
// ".toISOString is not a function") ต้องแปลงเป็น string ก่อนเก็บ cache แล้วแปลงกลับเป็น Date ทุกครั้งที่ดึงออกมา
type SerializedOutstandingPeriod = Omit<OutstandingPeriod, "periodStart" | "periodEnd" | "dueDate"> & {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
};

export const CREDIT_TERM_CACHE_TAG = "credit-term-outstanding-periods";

const getCachedOutstandingPeriodsRaw = unstable_cache(
  async (): Promise<SerializedOutstandingPeriod[]> => {
    const result = await collectOutstandingPeriodsUncached();
    return result.map((o) => ({ ...o, periodStart: o.periodStart.toISOString(), periodEnd: o.periodEnd.toISOString(), dueDate: o.dueDate.toISOString() }));
  },
  ["credit-term-outstanding-periods"],
  // 2 นาที — ทุกจุดที่แก้ข้อมูลที่กระทบ (ปิดรอบ/ยกเลิก/แก้ยอดขายรายวัน/POS sync) revalidateTag ล้างให้ทันทีอยู่แล้ว
  { revalidate: 120, tags: [CREDIT_TERM_CACHE_TAG] }
);

async function getCachedOutstandingPeriods(): Promise<OutstandingPeriod[]> {
  const raw = await getCachedOutstandingPeriodsRaw();
  return raw.map((o) => ({ ...o, periodStart: new Date(o.periodStart), periodEnd: new Date(o.periodEnd), dueDate: new Date(o.dueDate) }));
}

export async function collectOutstandingPeriods(
  preloadedBranches?: Awaited<ReturnType<typeof fetchCreditTermBranches>>
): Promise<OutstandingPeriod[]> {
  if (preloadedBranches) return collectOutstandingPeriodsUncached(preloadedBranches);
  return getCachedOutstandingPeriods();
}

/**
 * ยอด Credit Term ที่ยังค้างอยู่กับห้าง แยกตามสาขา — คิดจากทุกรอบตั้งแต่มีข้อมูลขายจนถึงตอนนี้
 * ไม่ว่าจะกด "ปิดรอบ" ไว้แล้วหรือยัง (รอบที่ยังไม่ปิดจะคำนวณสดจากยอดขายจริง, รอบที่ปิดแล้วและจ่ายแล้วจะไม่นับ)
 */
export function derivePerBranchOutstanding(outstanding: OutstandingPeriod[]): BranchOutstanding[] {
  const byBranch = new Map<string, BranchOutstanding>();
  for (const o of outstanding) {
    const existing = byBranch.get(o.branchId) ?? { branchId: o.branchId, branchName: o.branchName, totalOutstanding: 0, pendingCycles: 0 };
    existing.totalOutstanding += o.netAmount;
    existing.pendingCycles += 1;
    byBranch.set(o.branchId, existing);
  }
  return Array.from(byBranch.values());
}

export async function getPerBranchOutstanding(): Promise<BranchOutstanding[]> {
  return derivePerBranchOutstanding(await collectOutstandingPeriods());
}

/**
 * ยอด Credit Term ที่ยังค้างรับ แบบละเอียดทีละรอบ (ไม่รวมยอดข้ามรอบเหมือน getPerBranchOutstanding)
 * เรียงตามวันครบกำหนดจากใกล้สุดไปไกลสุด — ใช้เช็คว่าเงินที่เข้าบัญชีแต่ละก้อนตรงกับห้าง/รอบไหน
 */
export function deriveOutstandingDetail(outstanding: OutstandingPeriod[]): OutstandingPeriod[] {
  return [...outstanding].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.branchName.localeCompare(b.branchName));
}

export async function getOutstandingDetail(): Promise<OutstandingPeriod[]> {
  return deriveOutstandingDetail(await collectOutstandingPeriods());
}

export interface DueDateGroup {
  dueDate: Date;
  totalAmount: number;
  count: number;
}

/**
 * ยอด Credit Term ที่ยังค้างรับ จัดกลุ่มตามวันครบกำหนด — รวมทั้งรอบที่ปิดรอบแล้ว (PENDING) และรอบที่ยังไม่ได้
 * ปิดรอบเลย (คำนวณสดจากยอดขายจริง) ไม่งั้นจะเห็นแค่เศษเสี้ยวที่เคยกดปิดรอบไว้ ทั้งที่ยอดค้างจริงส่วนใหญ่ยังไม่ปิดรอบ
 */
export function deriveOutstandingByDueDate(outstanding: OutstandingPeriod[]): DueDateGroup[] {
  const byDueDate = new Map<string, DueDateGroup>();
  for (const o of outstanding) {
    const key = o.dueDate.toISOString();
    const existing = byDueDate.get(key) ?? { dueDate: o.dueDate, totalAmount: 0, count: 0 };
    existing.totalAmount += o.netAmount;
    existing.count += 1;
    byDueDate.set(key, existing);
  }
  return Array.from(byDueDate.values()).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export async function getOutstandingByDueDate(): Promise<DueDateGroup[]> {
  return deriveOutstandingByDueDate(await collectOutstandingPeriods());
}
