import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { phoneFromCookies } from "@/lib/me";
import { normalizeTime } from "@/lib/validation";
import { toRange, todayTH } from "@/lib/schedule";
import { validatePublicRange } from "@/lib/publicRules";

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
  if (request.shift && request.shift.slots.length > 0) return { error: NextResponse.json({ error: "กะนี้มีการกรอกยอดแล้ว กรุณาติดต่อทีมงานหากต้องการแก้ไข" }, { status: 400 }) };
  return { request, phone };
}

const stamp = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");

/** แก้เวลาช่วงของตัวเอง — body: { startTime, endTime } */
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
  if (startTime === request.startTime && endTime === request.endTime) return NextResponse.json({ ok: true, request });

  const conflict = await validatePublicRange({ date: request.date, channelId: request.channelId, range, excludeShiftId: request.shiftId, excludeRequestId: request.id });
  if (conflict) return NextResponse.json(conflict, { status: 409 });

  const log = `คนไลฟ์แก้เวลาเอง ${request.startTime}–${request.endTime} → ${startTime}–${endTime} (${stamp()})`;
  const updated = await prisma.$transaction(async (tx) => {
    if (request.shiftId) await tx.liveShift.update({ where: { id: request.shiftId }, data: { startTime, endTime, note: [request.shift?.note, log].filter(Boolean).join(" · ") } });
    return tx.slotRequest.update({
      where: { id: request.id },
      data: { startTime, endTime, note: [request.note, log].filter(Boolean).join(" · ") },
      select: { id: true, date: true, startTime: true, endTime: true, status: true },
    });
  });
  return NextResponse.json({ ok: true, request: updated });
}

/** ยกเลิกช่วงของตัวเอง — ถ้าอนุมัติแล้ว กะจะถูกถอดออกจากตารางด้วย */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const own = await loadOwn(params.id);
  if ("error" in own) return own.error;
  const { request } = own;
  const log = `ยกเลิกโดยคนไลฟ์เอง (${stamp()})`;
  await prisma.$transaction(async (tx) => {
    await tx.slotRequest.update({ where: { id: request.id }, data: { status: "CANCELLED", reviewNote: log, reviewedAt: new Date(), shiftId: null } });
    if (request.shiftId) await tx.liveShift.delete({ where: { id: request.shiftId } });
  });
  return NextResponse.json({ ok: true });
}
