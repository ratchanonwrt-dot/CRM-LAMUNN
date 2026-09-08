import { timeToMinutes } from "@/lib/format";

/** "YYYY-MM-DD" -> Date ที่ UTC เที่ยงคืน (ให้ตรงกับ @db.Date ของ Prisma) */
export function parseDateOnly(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ตรวจ "HH:mm" และคืนค่าแบบ normalize เป็น 2 หลัก (เช่น "9:05" -> "09:05") */
export function normalizeTime(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const mins = timeToMinutes(s);
  if (mins === null) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function optionalTime(s: unknown): { ok: true; value: string | null } | { ok: false } {
  if (s === undefined || s === null || s === "") return { ok: true, value: null };
  const t = normalizeTime(s);
  return t ? { ok: true, value: t } : { ok: false };
}

export function toInt(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function toFloat(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function optionalText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

/** ตรวจ body ของ slot (ใช้ทั้ง POST และ PATCH — field ที่ไม่ได้ส่งมาจะเป็น undefined) */
export function parseSlotBody(body: Record<string, unknown>, partial: boolean) {
  const errors: string[] = [];
  const data: {
    streamerId?: string;
    startTime?: string;
    endTime?: string;
    viewers?: number;
    peakViewers?: number | null;
    sales?: number;
    orders?: number | null;
    note?: string | null;
  } = {};

  if (!partial || body.streamerId !== undefined) {
    if (typeof body.streamerId === "string" && body.streamerId) data.streamerId = body.streamerId;
    else errors.push("กรุณาเลือกคนไลฟ์");
  }
  if (!partial || body.startTime !== undefined) {
    const t = normalizeTime(body.startTime);
    if (t) data.startTime = t;
    else errors.push("เวลาเริ่มไม่ถูกต้อง (รูปแบบ HH:mm)");
  }
  if (!partial || body.endTime !== undefined) {
    const t = normalizeTime(body.endTime);
    if (t) data.endTime = t;
    else errors.push("เวลาสิ้นสุดไม่ถูกต้อง (รูปแบบ HH:mm)");
  }
  if (!partial || body.viewers !== undefined) {
    const n = toInt(body.viewers);
    if (n !== null && n >= 0) data.viewers = n;
    else errors.push("ยอดคนดูต้องเป็นตัวเลข 0 ขึ้นไป");
  }
  if (body.peakViewers !== undefined) {
    const n = toInt(body.peakViewers);
    if (body.peakViewers === null || body.peakViewers === "") data.peakViewers = null;
    else if (n !== null && n >= 0) data.peakViewers = n;
    else errors.push("ยอดคนดูสูงสุดต้องเป็นตัวเลข 0 ขึ้นไป");
  }
  if (!partial || body.sales !== undefined) {
    const n = toFloat(body.sales);
    if (body.sales === undefined || body.sales === null || body.sales === "") data.sales = 0;
    else if (n !== null && n >= 0) data.sales = n;
    else errors.push("ยอดขายต้องเป็นตัวเลข 0 ขึ้นไป");
  }
  if (body.orders !== undefined) {
    const n = toInt(body.orders);
    if (body.orders === null || body.orders === "") data.orders = null;
    else if (n !== null && n >= 0) data.orders = n;
    else errors.push("จำนวนออเดอร์ต้องเป็นตัวเลข 0 ขึ้นไป");
  }
  if (body.note !== undefined) data.note = optionalText(body.note);

  return { data, errors };
}
