import { timeToMinutes } from "@/lib/format";

/** ช่องเวลาของแต่ละวัน: 00:00 - 23:59 (เที่ยงคืนถัดไป = นาทีที่ 1440) */
export const DAY_START_MIN = 0;
/** เวลาที่แนะนำให้เริ่มลงกะเมื่อกดปุ่ม "ลงกะใหม่" โดยไม่ได้คลิกช่อง */
export const PREFERRED_START_MIN = 10 * 60;
export const DAY_END_MIN = 24 * 60;

export interface MinuteRange {
  s: number; // นาทีจากเที่ยงคืนของวันนั้น
  e: number; // มากกว่า s เสมอ (อาจเกิน 1440 ถ้าข้ามวัน)
}

/** แปลง "HH:mm"-"HH:mm" เป็นช่วงนาที — end ที่น้อยกว่าหรือเท่ากับ start ถือว่าเป็นวันถัดไป ("00:00" = เที่ยงคืน) */
export function toRange(startTime: string, endTime: string): MinuteRange | null {
  const s = timeToMinutes(startTime);
  const e0 = timeToMinutes(endTime);
  if (s === null || e0 === null) return null;
  const e = e0 <= s ? e0 + DAY_END_MIN : e0;
  return { s, e };
}

export function rangesOverlap(a: MinuteRange, b: MinuteRange): boolean {
  return a.s < b.e && b.s < a.e;
}

export function minutesToLabel(m: number): string {
  const mm = ((m % DAY_END_MIN) + DAY_END_MIN) % DAY_END_MIN;
  return `${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`;
}

/** ช่วงที่ยังว่างในหน้าต่าง [dayStart, dayEnd) หลังหักกะที่ลงไว้แล้ว */
export function freeRanges(taken: MinuteRange[], dayStart = DAY_START_MIN, dayEnd = DAY_END_MIN): MinuteRange[] {
  const sorted = [...taken].sort((a, b) => a.s - b.s);
  const out: MinuteRange[] = [];
  let cursor = dayStart;
  for (const r of sorted) {
    if (r.e <= cursor) continue;
    if (r.s > cursor) out.push({ s: cursor, e: Math.min(r.s, dayEnd) });
    cursor = Math.max(cursor, r.e);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) out.push({ s: cursor, e: dayEnd });
  return out.filter((r) => r.e - r.s >= 30); // ช่องว่างสั้นกว่า 30 นาทีไม่นับ
}

/** วันจันทร์ (UTC เที่ยงคืน) ของสัปดาห์ที่วันนั้นอยู่ */
export function weekStartOf(d: Date): Date {
  const day = d.getUTCDay(); // 0=อาทิตย์
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** วันนี้ตามเวลาไทย เป็น Date ที่ UTC เที่ยงคืน (ให้ตรงกับ @db.Date) */
export function todayTH(): Date {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** สีประจำคนไลฟ์ — กำหนดตามลำดับในรายชื่อ (คงที่ ไม่เปลี่ยนตามสัปดาห์) ใช้คู่กับชื่อเสมอ ไม่ใช้สีเดี่ยว ๆ */
export const STREAMER_COLORS = [
  "bg-rose-100 border-rose-300 text-rose-900",
  "bg-sky-100 border-sky-300 text-sky-900",
  "bg-amber-100 border-amber-300 text-amber-900",
  "bg-emerald-100 border-emerald-300 text-emerald-900",
  "bg-violet-100 border-violet-300 text-violet-900",
  "bg-orange-100 border-orange-300 text-orange-900",
  "bg-teal-100 border-teal-300 text-teal-900",
  "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900",
];
export const STREAMER_COLOR_FALLBACK = "bg-gray-100 border-gray-300 text-gray-800";

export function streamerColor(index: number): string {
  return index >= 0 && index < STREAMER_COLORS.length ? STREAMER_COLORS[index] : STREAMER_COLOR_FALLBACK;
}
