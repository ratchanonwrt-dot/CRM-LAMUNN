import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { checkShiftConflicts } from "@/lib/shiftValidation";
import { attachShiftToSession, syncSessionTimes } from "@/lib/shiftSession";
import { optionalText } from "@/lib/validation";
import { pickUnusedColor } from "@/lib/schedule";

/**
 * อนุมัติ / ปฏิเสธ คำขอจองกะ (ผู้จัดการขึ้นไป)
 * body: { action: "approve", streamerId?: string, createStreamer?: boolean, note?: string }
 *       { action: "reject", note?: string }
 * คำขอที่มี replacesShiftId = คนไลฟ์ขอเปลี่ยนเวลาของกะที่อนุมัติแล้ว → อนุมัติแล้วจะแก้เวลากะเดิม (ไม่สร้างกะใหม่)
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const request = await prisma.slotRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "ไม่พบคำขอ" }, { status: 404 });
  if (request.status !== "PENDING") return NextResponse.json({ error: "คำขอนี้ถูกตอบไปแล้ว" }, { status: 400 });

  const body = await req.json();
  const note = optionalText(body.note);

  if (body.action === "reject") {
    const updated = await prisma.slotRequest.update({
      where: { id: params.id },
      data: { status: "REJECTED", reviewNote: note, reviewedByStaffId: staff.staffId, reviewedAt: new Date() },
    });
    return NextResponse.json({ request: updated });
  }

  if (body.action !== "approve") return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });

  // ---- คำขอเปลี่ยนเวลาของกะที่อนุมัติแล้ว: แก้กะเดิม ----
  const replaces = request.replacesShiftId ? await prisma.liveShift.findUnique({ where: { id: request.replacesShiftId }, include: { request: { select: { id: true } } } }) : null;
  if (replaces) {
    const shiftData = { date: replaces.date, streamerId: replaces.streamerId, channelId: replaces.channelId, startTime: request.startTime, endTime: request.endTime, note: replaces.note };
    const conflict = await checkShiftConflicts(shiftData, replaces.id);
    if (conflict) return NextResponse.json({ error: `อนุมัติไม่ได้: ${conflict}` }, { status: 409 });
    const log = `ทีมงานอนุมัติเปลี่ยนเวลา ${replaces.startTime}–${replaces.endTime} → ${request.startTime}–${request.endTime}`;
    const updated = await prisma.$transaction(async (tx) => {
      // คำขอเดิมที่ผูกกะอยู่ → ปิดเป็น "ถูกแทนที่" เพื่อให้คำขอใหม่ผูกกะแทน (shiftId unique)
      if (replaces.request) {
        await tx.slotRequest.update({ where: { id: replaces.request.id }, data: { shiftId: null, status: "CANCELLED", reviewNote: `ถูกแทนที่ด้วยคำขอเปลี่ยนเวลา ${request.startTime}–${request.endTime}`, reviewedByStaffId: staff.staffId, reviewedAt: new Date() } });
      }
      await tx.liveShift.update({ where: { id: replaces.id }, data: { startTime: request.startTime, endTime: request.endTime, note: [replaces.note, log, note].filter(Boolean).join(" · ") || null } });
      return tx.slotRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED", streamerId: replaces.streamerId, shiftId: replaces.id, reviewNote: note, reviewedByStaffId: staff.staffId, reviewedAt: new Date() },
      });
    });
    await syncSessionTimes(replaces.sessionId);
    return NextResponse.json({ request: updated, shiftId: replaces.id });
  }

  // ---- คำขอปกติ: เลือกคนไลฟ์ (ที่ส่งมา / สร้างใหม่จากข้อมูลคำขอ) แล้วสร้างกะ ----
  let streamerId: string | null = typeof body.streamerId === "string" && body.streamerId ? body.streamerId : null;
  if (!streamerId && body.createStreamer) {
    const used = (await prisma.streamer.findMany({ where: { isActive: true }, select: { color: true } })).map((s) => s.color);
    const created = await prisma.streamer.create({
      data: { name: request.requesterName, phone: request.requesterPhone, lineId: request.requesterLine, color: pickUnusedColor(used), note: "สร้างจากคำขอจองบนเว็บ" },
    });
    streamerId = created.id;
  }
  if (!streamerId) return NextResponse.json({ error: "กรุณาเลือกคนไลฟ์ หรือเลือกสร้างคนไลฟ์ใหม่จากคำขอ" }, { status: 400 });
  const streamer = await prisma.streamer.findUnique({ where: { id: streamerId } });
  if (!streamer) return NextResponse.json({ error: "ไม่พบคนไลฟ์" }, { status: 400 });

  const shiftData = { date: request.date, streamerId, channelId: request.channelId, startTime: request.startTime, endTime: request.endTime, note: note ?? request.note };
  const conflict = await checkShiftConflicts(shiftData, null);
  if (conflict) return NextResponse.json({ error: `อนุมัติไม่ได้: ${conflict}` }, { status: 409 });

  const shift = await prisma.liveShift.create({ data: { ...shiftData, createdByStaffId: staff.staffId } });
  await attachShiftToSession(shift.id, staff.staffId);
  const updated = await prisma.slotRequest.update({
    where: { id: params.id },
    data: { status: "APPROVED", streamerId, shiftId: shift.id, reviewNote: note, reviewedByStaffId: staff.staffId, reviewedAt: new Date() },
  });
  return NextResponse.json({ request: updated, shiftId: shift.id });
}
