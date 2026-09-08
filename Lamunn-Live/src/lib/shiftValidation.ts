import { prisma } from "@lamunn/db-live";
import { parseDateOnly, normalizeTime, optionalText } from "@/lib/validation";
import { toRange, rangesOverlap } from "@/lib/schedule";

export interface ShiftData {
  date: Date;
  streamerId: string;
  channelId: string | null;
  startTime: string;
  endTime: string;
  note: string | null;
}

type Parsed = { ok: true; data: ShiftData } | { ok: false; error: string };

/** ตรวจ body ของกะ — partial=true สำหรับ PATCH (ต้องส่ง `current` มาเพื่อเติม field ที่ไม่ได้แก้) */
export async function parseShiftBody(body: Record<string, unknown>, partial: boolean, current?: ShiftData): Promise<Parsed> {
  const date = body.date !== undefined ? parseDateOnly(body.date) : (current?.date ?? null);
  if (!date) return { ok: false, error: "กรุณาระบุวันที่ให้ถูกต้อง" };

  const streamerId = body.streamerId !== undefined ? (typeof body.streamerId === "string" ? body.streamerId : "") : (current?.streamerId ?? "");
  if (!streamerId) return { ok: false, error: "กรุณาเลือกคนไลฟ์" };
  const streamer = await prisma.streamer.findUnique({ where: { id: streamerId } });
  if (!streamer) return { ok: false, error: "ไม่พบคนไลฟ์ที่เลือก" };

  let channelId: string | null = current?.channelId ?? null;
  if (body.channelId !== undefined) {
    channelId = typeof body.channelId === "string" && body.channelId ? body.channelId : null;
    if (channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) return { ok: false, error: "ไม่พบช่องทางที่เลือก" };
    }
  }

  const startTime = body.startTime !== undefined ? normalizeTime(body.startTime) : (current?.startTime ?? null);
  const endTime = body.endTime !== undefined ? normalizeTime(body.endTime) : (current?.endTime ?? null);
  if (!startTime) return { ok: false, error: "เวลาเริ่มไม่ถูกต้อง (HH:mm)" };
  if (!endTime) return { ok: false, error: "เวลาจบไม่ถูกต้อง (HH:mm)" };
  const range = toRange(startTime, endTime);
  if (!range) return { ok: false, error: "ช่วงเวลาไม่ถูกต้อง" };
  if (range.e - range.s > 16 * 60) return { ok: false, error: "กะยาวเกิน 16 ชั่วโมง — ตรวจเวลาเริ่ม/จบอีกครั้ง" };

  const note = body.note !== undefined ? optionalText(body.note) : (current?.note ?? null);
  if (partial && !current) return { ok: false, error: "missing current shift" };

  return { ok: true, data: { date, streamerId, channelId, startTime, endTime, note } };
}

/** ห้ามลงกะซ้อนกัน: ช่องทางเดียวกัน (หรือไม่ระบุช่องทางเหมือนกัน) เวลาทับกันไม่ได้ และคนเดียวกันไลฟ์สองที่พร้อมกันไม่ได้ */
export async function checkShiftConflicts(data: ShiftData, excludeId: string | null): Promise<string | null> {
  const range = toRange(data.startTime, data.endTime)!;
  const sameDay = await prisma.liveShift.findMany({
    where: { date: data.date, ...(excludeId ? { id: { not: excludeId } } : {}) },
    include: { streamer: true, channel: true },
  });
  for (const s of sameDay) {
    const r = toRange(s.startTime, s.endTime);
    if (!r || !rangesOverlap(range, r)) continue;
    if (s.streamerId === data.streamerId) {
      return `${s.streamer.name} มีกะ ${s.startTime}–${s.endTime} อยู่แล้ว ทับกับช่วงนี้`;
    }
    if ((s.channelId ?? null) === (data.channelId ?? null)) {
      return `ช่วง ${s.startTime}–${s.endTime} ${s.channel ? `ของ ${s.channel.name} ` : ""}มี ${s.streamer.name} ลงไว้แล้ว`;
    }
  }
  return null;
}
