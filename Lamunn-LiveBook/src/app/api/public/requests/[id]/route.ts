import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { phoneFromCookies } from "@/lib/me";
import { normalizeTime } from "@/lib/validation";
import { toRange, todayTH } from "@/lib/schedule";
import { validatePublicRange } from "@/lib/publicRules";
import { EDIT_LEAD_HOURS, EDIT_LEAD_MESSAGE, startsWithin } from "@/lib/bookingRules";

export const dynamic = "force-dynamic";

/** หาคำขอของ "ฉัน" (เบอร์ในคุกกี้ต้องตรง) ที่ยังแก้ได้: รออนุมัติ หรืออนุมัติแล้วแต่ยังไม่ถึงวัน/ยังไม่กรอกยอด */
async function loadOwn(id: string) {
  const phone = phoneFromCookies();
  if (!phone) return { error: NextResponse.json({ error: "กรุณาใส่เบอร์โทรของคุณก่อน" }, { status: 401 }) };
  const request = await prisma.slotRequest.findUnique({ where: { id }, include: { shift: { include: { slots: { select: { id: true } } } } } });
  if (!request || request.requesterPhone !== phone) return { error: NextResponse.json({ error: "ไม่พบช่วงนี้ในคำขอของคุณ" }, { status: 404 }) };
  if (request.status === "REJECTED" || request.status === "CANCELLED") return { error: NextResponse.json({ error: "ช่วงนี้ถูกปิดไปแล้ว แก้ไขไม่ได้" }, { status: 400 }) };
  if (request.status === "APPROVED" && !request.shift) return { error: NextResponse.json({ error: "กะนี้ถูกทีมงานเปลี่ยนแปลงแล้ว กรุณาติดต่อทีมงาน" }, { status: 400 }) };
  if (request.date < todayTH()) return { error: NextResponse.json({ error: "ช่วงที่ผ่านไปแล้วแก้ไขไม่ได้" }, { status: 400 }) };
  // ต้องแก้/ยกเลิกล่วงหน้าอย่างน้อย 6 ชม. ก่อนเวลาเริ่มไลฟ์ (ใช้เวลาของกะถ้าอนุมัติแล้ว)
  if (startsWithin(request.date, request.shift?.startTime ?? request.startTime, EDIT_LEAD_HOURS)) return { error: NextResponse.json({ error: `ใกล้ถึงเวลาไลฟ์แล้ว — ${EDIT_LEAD_MESSAGE} หากจำเป็นกรุณาติดต่อทีมงาน` }, { status: 400 }) };
  if (request.shift && request.shift.slots.length > 0) return { error: NextResponse.json({ error: "กะนี้มีการกรอกยอดแล้ว กรุณาติดต่อทีมงานหากต้องการแก้ไข" }, { status: 400 }) };
  return { request, phone };
}

const stamp = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
const joinNote = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ") || null;

/**
 * แก้เวลาช่วงของตัวเอง — body: { startTime, endTime }
 * - ยังรออนุมัติ: แก้ได้เลย (ทีมงานเห็นเวลาใหม่ตอนอนุมัติ)
 * - อนุมัติแล้ว + ย่อให้แคบลงภายในช่วงเดิม: มีผลทันที
 * - อนุมัติแล้ว + ขยาย/เลื่อนออกนอกช่วงเดิม: สร้างคำขอเปลี่ยนเวลา (PENDING, replacesShiftId) รอทีมงานอนุมัติ กะเดิมยังอยู่
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const own = await loadOwn(params.id);
  if ("error" in own) return own.error;
  const { request } = own;

  const body = await req.json().catch(() => ({}));
  const startTime = normalizeTime(body.startTime);
  const endTime = normalizeTime(body.endTime);
  const range = startTime && endTime ? toRange(startTime, endTime) : null;
  if (!startTime || !endTime || !range) return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
  if (range.e - range.s < 60) return NextResponse.json({ error: "ช่วงไลฟ์อย่างน้อย 1 ชั่วโมง" }, { status: 400 });
  if (range.e - range.s > 12 * 60) return NextResponse.json({ error: "ช่วงไลฟ์ได้ไม่เกิน 12 ชั่วโมง" }, { status: 400 });

  // ---- ยังรออนุมัติ (รวมคำขอเปลี่ยนเวลา): แก้ตัวคำขอได้เลย ----
  if (request.status === "PENDING") {
    if (startTime === request.startTime && endTime === request.endTime) return NextResponse.json({ ok: true, applied: true });
    const conflict = await validatePublicRange({ date: request.date, channelId: request.channelId, range, excludeShiftId: request.replacesShiftId, excludeRequestId: request.id });
    if (conflict) return NextResponse.json(conflict, { status: 409 });
    const log = `คนไลฟ์แก้เวลาเอง ${request.startTime}–${request.endTime} → ${startTime}–${endTime} (${stamp()})`;
    const updated = await prisma.slotRequest.update({ where: { id: request.id }, data: { startTime, endTime, note: joinNote(request.note, log) }, select: { id: true, startTime: true, endTime: true, status: true } });
    return NextResponse.json({ ok: true, applied: true, request: updated });
  }

  // ---- อนุมัติแล้ว ----
  const shift = request.shift!;
  const old = toRange(shift.startTime, shift.endTime);
  if (!old) return NextResponse.json({ error: "ข้อมูลกะเดิมไม่ถูกต้อง กรุณาติดต่อทีมงาน" }, { status: 400 });
  if (startTime === shift.startTime && endTime === shift.endTime) return NextResponse.json({ ok: true, applied: true });
  const shrink = range.s >= old.s && range.e <= old.e;

  if (shrink) {
    const log = `คนไลฟ์ย่อเวลาเอง ${shift.startTime}–${shift.endTime} → ${startTime}–${endTime} (${stamp()})`;
    await prisma.$transaction([
      prisma.liveShift.update({ where: { id: shift.id }, data: { startTime, endTime, note: joinNote(shift.note, log) } }),
      prisma.slotRequest.update({ where: { id: request.id }, data: { startTime, endTime, note: joinNote(request.note, log) } }),
    ]);
    return NextResponse.json({ ok: true, applied: true });
  }

  // ขยาย/เลื่อน: ต้องให้ทีมงานอนุมัติก่อน — ใช้คำขอเปลี่ยนเวลาเดิมถ้ามี ไม่งั้นสร้างใหม่
  const existing = await prisma.slotRequest.findFirst({ where: { replacesShiftId: shift.id, status: "PENDING" } });
  const conflict = await validatePublicRange({ date: request.date, channelId: request.channelId, range, excludeShiftId: shift.id, excludeRequestId: existing?.id ?? null });
  if (conflict) return NextResponse.json(conflict, { status: 409 });
  const note = `ขอเปลี่ยนเวลาจากกะที่อนุมัติแล้ว ${shift.startTime}–${shift.endTime} → ${startTime}–${endTime} (${stamp()})`;
  const change = existing
    ? await prisma.slotRequest.update({ where: { id: existing.id }, data: { startTime, endTime, note }, select: { id: true, startTime: true, endTime: true, status: true } })
    : await prisma.slotRequest.create({
        data: {
          date: request.date,
          startTime,
          endTime,
          channelId: request.channelId,
          requesterName: request.requesterName,
          requesterPhone: request.requesterPhone,
          requesterLine: request.requesterLine,
          isReturning: request.isReturning,
          note,
          streamerId: request.streamerId,
          replacesShiftId: shift.id,
        },
        select: { id: true, startTime: true, endTime: true, status: true },
      });
  return NextResponse.json({ ok: true, applied: false, pendingChange: true, request: change });
}

/** ยกเลิกช่วงของตัวเอง — ไม่ต้องรออนุมัติ ถ้าอนุมัติแล้ว กะจะถูกถอดออกจากตารางทันที */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const own = await loadOwn(params.id);
  if ("error" in own) return own.error;
  const { request } = own;
  const log = `ยกเลิกโดยคนไลฟ์เอง (${stamp()})`;
  await prisma.$transaction(async (tx) => {
    await tx.slotRequest.update({ where: { id: request.id }, data: { status: "CANCELLED", reviewNote: log, reviewedAt: new Date(), shiftId: null } });
    if (request.shiftId) {
      // คำขอเปลี่ยนเวลาที่ค้างอยู่ของกะนี้ก็ยกเลิกตาม
      await tx.slotRequest.updateMany({ where: { replacesShiftId: request.shiftId, status: "PENDING" }, data: { status: "CANCELLED", reviewNote: `ยกเลิกตามกะเดิม (${stamp()})`, reviewedAt: new Date() } });
      await tx.liveShift.delete({ where: { id: request.shiftId } });
    }
  });
  return NextResponse.json({ ok: true });
}
