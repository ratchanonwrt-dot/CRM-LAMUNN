import { unstable_cache } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { getCashBranchIds } from "./branchCache";
import { parseDateOnly } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { getPerBranchOutstanding } from "@/lib/creditTermCalc";

/** เงินสดสะสมที่ส่งกลับครัวกลาง = ยอดยกมา + เงินสดนับของสาขาที่ไม่ใช่ Credit Term + รายการปรับปรุงมือ (ปันผล/แก้ไข) ตั้งแต่วันยกมา
 * คืน cashBranchIds ติดมาด้วย เพราะหน้า cash-status ต้องใช้ต่อ — กันไม่ให้ query สาขา CASH ซ้ำสองรอบ
 * cache ไว้ 2 นาที + tag — ทุกจุดที่แก้ข้อมูลที่กระทบยอดนี้ (ปรับยอดเงินสด, แก้ยอดขายรายวัน, POS sync ที่มี
 * ของใหม่) ต้องเรียก revalidateTag(CASH_ON_HAND_CACHE_TAG) เพื่อล้างทันที — ตัวเลขจึงสดเสมอหลังการแก้
 * แต่การเปิดดูเฉยๆ ติด cache ได้นานขึ้นมาก (เดิม 20 วิแทบไม่เคย hit เพราะหมดอายุก่อนคนเปิดหน้าถัดไป)
 * unstable_cache ไม่เก็บ Date object จริง (คืนมาเป็น string ธรรมดา) ต้องแปลงเป็น string ก่อนเก็บ
 * แล้วแปลงกลับเป็น Date ทุกครั้งที่ดึงออกมา — ไม่งั้น .toISOString()/getUTCDate() ฝั่งที่เรียกใช้จะพังทันที */
export const CASH_ON_HAND_CACHE_TAG = "cash-on-hand";

const getCashOnHandCachedRaw = unstable_cache(
  async () => {
    const result = await getCashOnHandUncached();
    return { ...result, openingDate: result.openingDate.toISOString() };
  },
  ["cash-on-hand"],
  { revalidate: 120, tags: [CASH_ON_HAND_CACHE_TAG] }
);

export async function getCashOnHand(): Promise<{ balance: number; openingBalance: number; openingDate: Date; cashBranchIds: string[] }> {
  const raw = await getCashOnHandCachedRaw();
  return { ...raw, openingDate: new Date(raw.openingDate) };
}

/** ข้อมูลดิบทั้งหมดของเรื่องเงินสด — 2 คิวรี ใช้ได้ทั้งหน้าสถานะเงินสด ภาพรวม และสถานะการเงินบริษัท
 *
 * เดิมแต่ละหน้ายิง aggregate แยกช่วงวันที่กันเอง รวมกันแล้วหน้าสถานะเงินสดใช้ 32 SQL statement
 * ทั้งที่ยอดเงินสดรายวันมีแค่ไม่กี่ร้อยวัน และตารางรายการปรับปรุงมีไม่กี่แถว —
 * ดึงมาทั้งหมดครั้งเดียวแล้วตัดช่วง/รวมยอดในหน่วยความจำ ได้ผลเท่ากันเป๊ะ
 * (พิสูจน์ด้วย scripts/verify-refactor.ts — เทียบทุกฟิลด์ย้อนหลัง 3 เดือน) */
export async function loadCashRaw() {
  const cashBranchIds = await getCashBranchIds();
  const [dailyByDate, adjustments] = await Promise.all([
    prisma.dailySales.groupBy({
      by: ["date"],
      where: { branchId: { in: cashBranchIds } },
      _sum: { cashCounted: true },
    }),
    prisma.cashAdjustment.findMany({ orderBy: { date: "desc" } }),
  ]);
  return { cashBranchIds, dailyByDate, adjustments };
}

export type CashRaw = Awaited<ReturnType<typeof loadCashRaw>>;

/** ยอดเงินสดคงเหลือ = ยอดยกมา + เงินสดนับหลังวันยกมา + รายการปรับปรุงหลังวันยกมา
 * (เงื่อนไข > openingDate ตรงกับคิวรีเดิมทุกประการ) */
export function computeCashBalance(openingBalance: number, openingDate: Date, raw: CashRaw): number {
  let total = openingBalance;
  for (const d of raw.dailyByDate) if (d.date > openingDate) total += d._sum.cashCounted ?? 0;
  for (const a of raw.adjustments) if (a.date > openingDate) total += a.amount;
  return total;
}

async function getCashOnHandUncached(): Promise<{ balance: number; openingBalance: number; openingDate: Date; cashBranchIds: string[] }> {
  const [settings, raw] = await Promise.all([getAllSettings(), loadCashRaw()]);
  const openingBalance = Number(settings.cashOpeningBalance);
  const openingDate = parseDateOnly(settings.cashOpeningDate);

  return {
    balance: computeCashBalance(openingBalance, openingDate, raw),
    openingBalance,
    openingDate,
    cashBranchIds: raw.cashBranchIds,
  };
}

/**
 * ยอดค้างรับรวมจากห้าง (Credit Term) ที่ยังไม่ชำระ ณ ตอนนี้ — รวมทั้งรอบที่ปิดรอบแล้ว (มี CreditTermPayment)
 * และรอบที่ยังไม่ได้ปิดรอบ (คำนวณสดจากยอดขายจริง) ไม่งั้นตัวเลขจะต่ำกว่าความจริงมาก เพราะส่วนใหญ่ยังไม่ได้กดปิดรอบ
 */
export async function getCreditTermOutstanding(): Promise<number> {
  const perBranch = await getPerBranchOutstanding();
  return perBranch.reduce((sum, b) => sum + b.totalOutstanding, 0);
}
