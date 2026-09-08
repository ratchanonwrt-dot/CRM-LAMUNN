export function formatBaht(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatNum(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

export function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const thaiMonths = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export const thaiDays = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
export const thaiDaysShort = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function thaiMonthLabel(year: number, monthIndex0: number): string {
  return `${thaiMonths[monthIndex0]} ${year + 543}`;
}

/** วันที่แบบ @db.Date ถูกเก็บเป็น UTC เที่ยงคืน — อ่านด้วย getUTC* เสมอ ไม่งั้นโซนเวลาไทยจะเลื่อนวัน */
export function formatThaiDate(d: Date): string {
  return `${d.getUTCDate()} ${thaiMonths[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}

export function formatThaiDateShort(d: Date): string {
  return `${thaiDaysShort[d.getUTCDay()]} ${d.getUTCDate()} ${thaiMonthsShort[d.getUTCMonth()]}`;
}

/** "HH:mm" -> นาทีนับจากเที่ยงคืน (null ถ้ารูปแบบผิด) */
export function timeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** ระยะเวลา (ชั่วโมง) ระหว่าง start/end — ถ้า end น้อยกว่า start ถือว่าข้ามเที่ยงคืน */
export function slotHours(start: string, end: string): number {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export function formatHours(h: number): string {
  if (!h) return "0 ชม.";
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins} น.`;
  return mins ? `${whole} ชม. ${mins} น.` : `${whole} ชม.`;
}
