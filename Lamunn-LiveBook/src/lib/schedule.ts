import { timeToMinutes } from "@/lib/format";

/** ตารางไลฟ์เปิด 10:00 - 03:00 (ของวันถัดไป) — กะยังนับเป็นวันที่เริ่ม */
export const DAY_START_MIN = 10 * 60;
/** ขอบล่างของตาราง = 03:00 วันถัดไป (นาทีที่ 1620) */
export const GRID_END_MIN = 27 * 60;
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
export function freeRanges(taken: MinuteRange[], dayStart = DAY_START_MIN, dayEnd = GRID_END_MIN): MinuteRange[] {
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

/**
 * สีประจำคนไลฟ์ — เก็บเป็นชื่อสี (key) ใน Streamer.color เลือกได้ในหน้าคนไลฟ์
 * ใช้คู่กับชื่อเสมอ ไม่ใช้สีเดี่ยว ๆ บอกตัวตน (class ต้องเขียนเต็มให้ Tailwind เก็บได้)
 */
export const STREAMER_PALETTE: { key: string; label: string; block: string; dot: string }[] = [
  { key: "rose", label: "ชมพูแดง", block: "bg-rose-200 border-rose-400 text-rose-950", dot: "bg-rose-400" },
  { key: "sky", label: "ฟ้า", block: "bg-sky-200 border-sky-400 text-sky-950", dot: "bg-sky-400" },
  { key: "amber", label: "เหลือง", block: "bg-amber-200 border-amber-400 text-amber-950", dot: "bg-amber-400" },
  { key: "emerald", label: "เขียว", block: "bg-emerald-200 border-emerald-400 text-emerald-950", dot: "bg-emerald-400" },
  { key: "violet", label: "ม่วง", block: "bg-violet-200 border-violet-400 text-violet-950", dot: "bg-violet-400" },
  { key: "orange", label: "ส้ม", block: "bg-orange-200 border-orange-400 text-orange-950", dot: "bg-orange-400" },
  { key: "teal", label: "เขียวน้ำทะเล", block: "bg-teal-200 border-teal-400 text-teal-950", dot: "bg-teal-400" },
  { key: "fuchsia", label: "บานเย็น", block: "bg-fuchsia-200 border-fuchsia-400 text-fuchsia-950", dot: "bg-fuchsia-400" },
  { key: "lime", label: "เขียวมะนาว", block: "bg-lime-200 border-lime-400 text-lime-950", dot: "bg-lime-400" },
  { key: "indigo", label: "น้ำเงิน", block: "bg-indigo-200 border-indigo-400 text-indigo-950", dot: "bg-indigo-400" },
  { key: "pink", label: "ชมพู", block: "bg-pink-200 border-pink-400 text-pink-950", dot: "bg-pink-400" },
  { key: "cyan", label: "ฟ้าอมเขียว", block: "bg-cyan-200 border-cyan-400 text-cyan-950", dot: "bg-cyan-400" },
  { key: "red", label: "แดง", block: "bg-red-200 border-red-400 text-red-950", dot: "bg-red-500" },
  { key: "blue", label: "น้ำเงินเข้ม", block: "bg-blue-200 border-blue-400 text-blue-950", dot: "bg-blue-500" },
  { key: "yellow", label: "เหลืองสด", block: "bg-yellow-200 border-yellow-400 text-yellow-950", dot: "bg-yellow-400" },
  { key: "stone", label: "น้ำตาลเทา", block: "bg-stone-300 border-stone-500 text-stone-950", dot: "bg-stone-500" },
];
export const STREAMER_COLOR_FALLBACK = "bg-stone-100 border-line text-ink";
export const PALETTE_KEYS = STREAMER_PALETTE.map((p) => p.key);

export function streamerColor(key: string | null | undefined): string {
  return STREAMER_PALETTE.find((p) => p.key === key)?.block ?? STREAMER_COLOR_FALLBACK;
}

export function streamerDot(key: string | null | undefined): string {
  return STREAMER_PALETTE.find((p) => p.key === key)?.dot ?? "bg-gray-400";
}

/** เลือกสีที่ยังไม่มีใครใช้ (หรือใช้น้อยที่สุด) จากรายการสีที่ใช้อยู่ */
export function pickUnusedColor(used: (string | null | undefined)[]): string {
  const count = new Map<string, number>();
  for (const k of PALETTE_KEYS) count.set(k, 0);
  for (const u of used) if (u && count.has(u)) count.set(u, (count.get(u) ?? 0) + 1);
  let best = PALETTE_KEYS[0];
  let min = Infinity;
  for (const k of PALETTE_KEYS) {
    const c = count.get(k) ?? 0;
    if (c < min) {
      min = c;
      best = k;
    }
  }
  return best;
}
