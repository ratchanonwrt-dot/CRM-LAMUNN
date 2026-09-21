import { prisma } from "@lamunn/db-finance";

export interface GpRate {
  gpPercentStorefront: number;
  gpPercentDelivery: number;
}

/**
 * คืนอัตรา GP ที่มีผลจริงของทุกสาขา สำหรับเดือน year/month ที่ระบุ
 * ถ้าสาขาไหนมีการปรับ GP (GpRateHistory) ที่ effectiveYear/effectiveMonth <= เดือนที่ดู
 * จะใช้ค่าที่ effective ล่าสุด (ใหม่สุด) แทนค่าเริ่มต้นจาก RentConfig ที่ส่งมาใน baseRates
 */
type GpRateHistoryRow = { branchId: string; gpPercentStorefront: number; gpPercentDelivery: number };

/** ส่วน query ล้วนๆ แยกออกมาให้เรียกพร้อมกับ query อื่นใน Promise.all ได้ (ไม่ต้องรอ baseRates ก่อน เพราะไม่เกี่ยวกัน) */
export function queryGpRateHistories(year: number, month: number): Promise<GpRateHistoryRow[]> {
  return prisma.gpRateHistory.findMany({
    where: {
      OR: [{ effectiveYear: { lt: year } }, { effectiveYear: year, effectiveMonth: { lte: month } }],
    },
    orderBy: [{ effectiveYear: "asc" }, { effectiveMonth: "asc" }],
  });
}

/** ส่วน merge ล้วนๆ (sync ไม่แตะ DB) แยกจาก query เพื่อให้เรียกหลังจากมี baseRates พร้อมแล้วโดยไม่ต้อง await ซ้ำ */
export function applyGpRateHistories(baseRates: Map<string, GpRate>, histories: GpRateHistoryRow[]): Map<string, GpRate> {
  const result = new Map(baseRates);
  // เรียงเก่า -> ใหม่ แล้วเขียนทับเรื่อย ๆ สุดท้ายแต่ละสาขาจะเหลือค่า override ที่ effective ล่าสุด
  for (const h of histories) {
    result.set(h.branchId, { gpPercentStorefront: h.gpPercentStorefront, gpPercentDelivery: h.gpPercentDelivery });
  }
  return result;
}

export async function getEffectiveGpRates(year: number, month: number, baseRates: Map<string, GpRate>): Promise<Map<string, GpRate>> {
  const histories = await queryGpRateHistories(year, month);
  return applyGpRateHistories(baseRates, histories);
}
