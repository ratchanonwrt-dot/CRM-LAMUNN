import type { Prisma } from "@lamunn/db-finance";

/** เงินทั้งหมดในระบบบัญชีคำนวณเป็น "สตางค์" (จำนวนเต็ม) แล้วค่อยแปลงกลับตอนแสดงผล
 *
 * เหตุผล: ถ้าบวกลบด้วย float ตรงๆ งบทดลองจะไม่ลงตัวเป็นเศษสตางค์
 * (เช่น 0.1 + 0.2 = 0.30000000000000004) ซึ่งในงานบัญชีถือว่าใช้ไม่ได้
 * ในฐานข้อมูลเก็บเป็น Decimal(15,2) — ฟังก์ชันพวกนี้เป็นสะพานระหว่างสองฝั่ง */

export type Money = Prisma.Decimal | number | string | null | undefined;

/** แปลงค่าจากฐานข้อมูล (Decimal) หรือฟอร์ม (string/number) เป็นสตางค์ */
export function toSatang(v: Money): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v.toString());
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** แปลงสตางค์กลับเป็นบาท (ทศนิยม 2 ตำแหน่ง) สำหรับเขียนลงฐานข้อมูล/แสดงผล */
export function toBaht(satang: number): number {
  return Math.round(satang) / 100;
}

/** จัดรูปแบบสตางค์เป็นข้อความเงินไทย เช่น 1,234.50 — ยอด 0 แสดงเป็น "-" ให้อ่านตารางง่าย */
export function fmtSatang(satang: number, opts?: { zeroDash?: boolean }): string {
  if (satang === 0 && opts?.zeroDash !== false) return "-";
  return toBaht(satang).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** แยกยอดรวม VAT ออกเป็นฐานภาษี + VAT (ราคาหน้าร้านรวม VAT อยู่แล้วเสมอ)
 * ปัดเศษที่ตัว VAT แล้วให้ฐานภาษีเป็นส่วนที่เหลือ — ผลรวมจึงเท่ากับยอดเดิมเป๊ะเสมอ */
export function splitVatInclusive(totalSatang: number, vatRate: number): { base: number; vat: number } {
  if (vatRate <= 0) return { base: totalSatang, vat: 0 };
  const vat = Math.round((totalSatang * vatRate) / (1 + vatRate));
  return { base: totalSatang - vat, vat };
}

/** คิด VAT จากราคาที่ยังไม่รวมภาษี */
export function addVatExclusive(baseSatang: number, vatRate: number): { base: number; vat: number } {
  if (vatRate <= 0) return { base: baseSatang, vat: 0 };
  return { base: baseSatang, vat: Math.round(baseSatang * vatRate) };
}
