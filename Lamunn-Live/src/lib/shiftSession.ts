import { prisma } from "@lamunn/db-live";
import { toRange, minutesToLabel } from "@/lib/schedule";

/**
 * รอบไลฟ์ (LiveSession) = "วัน + ช่องทาง" — กะทุกกะและยอดทุกช่วงของวันนั้นสังกัดรอบเดียวกัน
 * หาให้ถ้ามีอยู่แล้ว ไม่มีก็สร้างใหม่ เพื่อให้หน้า "บันทึกรอบไลฟ์" เห็นกะตั้งแต่ตอนลงตาราง
 */
export async function ensureSessionFor(date: Date, channelId: string | null, createdByStaffId: string | null): Promise<string> {
  const existing = await prisma.liveSession.findFirst({ where: { date, channelId }, orderBy: { createdAt: "asc" } });
  if (existing) return existing.id;
  const created = await prisma.liveSession.create({ data: { date, channelId, createdByStaffId } });
  return created.id;
}

/** อัปเดตเวลาเริ่ม/จบของรอบให้ครอบทุกกะที่ผูกอยู่ (ถ้าไม่มีกะเหลือแล้วปล่อยค่าเดิม) */
export async function syncSessionTimes(sessionId: string | null | undefined): Promise<void> {
  if (!sessionId) return;
  const shifts = await prisma.liveShift.findMany({ where: { sessionId }, select: { startTime: true, endTime: true } });
  if (shifts.length === 0) return;
  let minS = Infinity;
  let maxE = -Infinity;
  for (const s of shifts) {
    const r = toRange(s.startTime, s.endTime);
    if (!r) continue;
    minS = Math.min(minS, r.s);
    maxE = Math.max(maxE, r.e);
  }
  if (!Number.isFinite(minS) || !Number.isFinite(maxE)) return;
  await prisma.liveSession.update({ where: { id: sessionId }, data: { startTime: minutesToLabel(minS), endTime: minutesToLabel(maxE) } });
}

/** ผูกกะเข้ากับรอบของวัน/ช่องทางนั้น ย้ายยอดที่กรอกไว้ตามไปด้วย และอัปเดตเวลาของรอบเก่า/ใหม่ */
export async function attachShiftToSession(shiftId: string, staffId: string | null): Promise<string> {
  const shift = await prisma.liveShift.findUniqueOrThrow({ where: { id: shiftId } });
  const sessionId = await ensureSessionFor(shift.date, shift.channelId, staffId);
  const previous = shift.sessionId;
  if (previous !== sessionId) {
    await prisma.liveShift.update({ where: { id: shiftId }, data: { sessionId } });
    await prisma.liveSlot.updateMany({ where: { shiftId }, data: { sessionId } });
    await syncSessionTimes(previous);
  }
  await syncSessionTimes(sessionId);
  return sessionId;
}
