import { prisma } from "@lamunn/db-live";
import { toRange, rangesOverlap, minutesToLabel, type MinuteRange } from "@/lib/schedule";
import { gapRuleApplies, findGapViolation } from "@/lib/bookingRules";

/**
 * ตรวจว่าคนนอกขอ/แก้ช่วงนี้ได้ไหม: ไม่ทับกะจริง ไม่ทับบล็อก และเว้น 30 นาที (ตั้งแต่ 2026-09-20)
 * exclude = กะ/คำขอของตัวเองที่กำลังแก้ (ไม่ต้องเทียบกับตัวเอง)
 */
export async function validatePublicRange(opts: {
  date: Date;
  channelId: string | null;
  range: MinuteRange;
  excludeShiftId?: string | null;
  excludeRequestId?: string | null;
}): Promise<{ error: string; code?: string } | null> {
  const { date, channelId, range } = opts;
  const booked = (await prisma.liveShift.findMany({ where: { date, channelId }, select: { id: true, startTime: true, endTime: true } })).filter((b) => b.id !== opts.excludeShiftId);
  for (const b of booked) {
    const r = toRange(b.startTime, b.endTime);
    if (r && rangesOverlap(r, range)) return { error: `ช่วง ${b.startTime}–${b.endTime} มีคนไลฟ์แล้ว กรุณาเลือกช่วงอื่น` };
  }
  const blocked = await prisma.scheduleBlock.findMany({ where: { date, OR: [{ channelId }, { channelId: null }] }, select: { startTime: true, endTime: true } });
  for (const b of blocked) {
    const r = toRange(b.startTime, b.endTime);
    if (r && rangesOverlap(r, range)) return { error: `ช่วง ${b.startTime}–${b.endTime} ไม่เปิดให้จอง (unavailable)` };
  }
  const pending = (await prisma.slotRequest.findMany({ where: { date, channelId, status: "PENDING" }, select: { id: true, startTime: true, endTime: true } })).filter((q) => q.id !== opts.excludeRequestId);
  for (const q of pending) {
    const r = toRange(q.startTime, q.endTime);
    if (r && rangesOverlap(r, range)) return { error: `ช่วง ${q.startTime}–${q.endTime} มีคนขอไว้แล้ว กรุณาเลือกช่วงอื่น` };
  }
  if (gapRuleApplies(date.toISOString().slice(0, 10))) {
    const existing = [...booked, ...pending].map((x) => toRange(x.startTime, x.endTime)).filter((r): r is MinuteRange => !!r);
    const v = findGapViolation(range, existing);
    if (v) return { error: v.message, code: "GAP" };
  }
  return null;
}

export function labelRange(r: MinuteRange): string {
  return `${minutesToLabel(r.s)}–${minutesToLabel(r.e)}`;
}
