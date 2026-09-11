import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { checkShiftConflicts } from "@/lib/shiftValidation";
import { attachShiftToSession } from "@/lib/shiftSession";
import { optionalText } from "@/lib/validation";
import { pickUnusedColor } from "@/lib/schedule";

/**
 * อนุมัติ / ปฏิเสธ คำขอจองกะ (ผู้จัดการขึ้นไป)
 * body: { action: "approve", streamerId?: string, createStreamer?: boolean, note?: string }
 *       { action: "reject", note?: string }
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

  // เลือกคนไลฟ์: ที่ส่งมา / สร้างใหม่จากข้อมูลคำขอ
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
