import { prisma } from "@lamunn/db-live";
import { addDays, freeRanges, isoDate, toRange, weekStartOf } from "@/lib/schedule";
import { thaiDaysShort } from "@/lib/format";

const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export type PublicBlockStatus = "booked" | "requested";

export interface PublicBlock {
  startTime: string;
  endTime: string;
  s: number;
  e: number;
  status: PublicBlockStatus; // booked = มีคนไลฟ์แล้ว (ไม่บอกชื่อ), requested = มีคนขอแล้ว รออนุมัติ
}

export interface PublicDay {
  date: string;
  dayLabel: string;
  isToday: boolean;
  isPast: boolean;
  blocks: PublicBlock[];
  free: { s: number; e: number }[];
}

export interface PublicWeek {
  weekStart: string;
  weekEnd: string;
  channelId: string | null;
  channels: { id: string; name: string }[];
  days: PublicDay[];
}

/** ตารางสัปดาห์แบบไม่ระบุตัวตน — ใช้ทั้งหน้าเว็บและ API สาธารณะ */
export async function loadPublicWeek(weekParam: string | undefined, channelParam: string | undefined, today: Date): Promise<PublicWeek> {
  const m = weekParam ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekParam) : null;
  const requested = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : today;
  const weekStart = weekStartOf(Number.isNaN(requested.getTime()) ? today : requested);
  const weekEnd = addDays(weekStart, 6);

  const channels = await prisma.channel.findMany({ where: { isActive: true, publicBooking: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } });
  const channelId = channelParam && channels.some((c) => c.id === channelParam) ? channelParam : (channels[0]?.id ?? null);

  const [shifts, requests] = await Promise.all([
    prisma.liveShift.findMany({ where: { date: { gte: weekStart, lte: weekEnd }, channelId }, select: { date: true, startTime: true, endTime: true } }),
    prisma.slotRequest.findMany({ where: { date: { gte: weekStart, lte: weekEnd }, channelId, status: "PENDING" }, select: { date: true, startTime: true, endTime: true } }),
  ]);

  const days: PublicDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const iso = isoDate(date);
    const blocks: PublicBlock[] = [];
    for (const s of shifts) {
      if (isoDate(s.date) !== iso) continue;
      const r = toRange(s.startTime, s.endTime);
      if (r) blocks.push({ startTime: s.startTime, endTime: s.endTime, s: r.s, e: r.e, status: "booked" });
    }
    for (const q of requests) {
      if (isoDate(q.date) !== iso) continue;
      const r = toRange(q.startTime, q.endTime);
      if (r) blocks.push({ startTime: q.startTime, endTime: q.endTime, s: r.s, e: r.e, status: "requested" });
    }
    blocks.sort((a, b) => a.s - b.s);
    return {
      date: iso,
      dayLabel: `${thaiDaysShort[date.getUTCDay()]} ${date.getUTCDate()} ${thaiMonthsShort[date.getUTCMonth()]}`,
      isToday: iso === isoDate(today),
      isPast: date < today,
      blocks,
      // "ว่าง" = ไม่มีทั้งกะจริงและคำขอที่รออยู่
      free: freeRanges(blocks.map((b) => ({ s: b.s, e: b.e }))),
    };
  });

  return { weekStart: isoDate(weekStart), weekEnd: isoDate(weekEnd), channelId, channels, days };
}
