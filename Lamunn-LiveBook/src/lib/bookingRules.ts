import { minutesToLabel, rangesOverlap, type MinuteRange } from "@/lib/schedule";

/** กติกาเว้นระยะสำหรับคนนอก: ตั้งแต่วันนี้เป็นต้นไป ต้องเว้นอย่างน้อย 30 นาทีจากกะ/คำขอที่มีอยู่แล้ว (แอดมินลงเองไม่ติด) */
export const PUBLIC_GAP_MINUTES = 30;
export const PUBLIC_GAP_FROM = "2026-09-20"; // YYYY-MM-DD

export function gapRuleApplies(isoDate: string): boolean {
  return isoDate >= PUBLIC_GAP_FROM;
}

/** ขยายช่วงที่มีคนแล้วออกข้างละ 30 นาที เพื่อคำนวณ "ว่างจริง" ที่คนนอกขอได้ */
export function padRanges(ranges: MinuteRange[], minutes = PUBLIC_GAP_MINUTES): MinuteRange[] {
  return ranges.map((r) => ({ s: r.s - minutes, e: r.e + minutes }));
}

export interface GapViolation {
  existing: MinuteRange;
  message: string;
}

/** ถ้า range ชิดกับ existing น้อยกว่า 30 นาที (หรือทับ) คืนคำเตือน ไม่งั้น null */
export function findGapViolation(range: MinuteRange, existing: MinuteRange[], minutes = PUBLIC_GAP_MINUTES): GapViolation | null {
  for (const r of existing) {
    const padded = { s: r.s - minutes, e: r.e + minutes };
    if (rangesOverlap(range, padded)) {
      const overlapping = rangesOverlap(range, r);
      return {
        existing: r,
        message: overlapping
          ? `ช่วง ${minutesToLabel(r.s)}–${minutesToLabel(r.e)} มีคนแล้ว กรุณาเลือกช่วงอื่น`
          : `ต้องเว้นอย่างน้อย ${minutes} นาทีจากช่วง ${minutesToLabel(r.s)}–${minutesToLabel(r.e)} ที่มีคนแล้ว — เริ่มได้ตั้งแต่ ${minutesToLabel(r.e + minutes)} หรือจบก่อน ${minutesToLabel(Math.max(0, r.s - minutes))}`,
      };
    }
  }
  return null;
}
