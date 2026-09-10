import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES, EDITOR_ROLES } from "@/lib/requireStaff";
import { parseShiftBody, checkShiftConflicts } from "@/lib/shiftValidation";
import { attachShiftToSession, syncSessionTimes } from "@/lib/shiftSession";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const shift = await prisma.liveShift.findUnique({
    where: { id: params.id },
    include: { streamer: true, channel: true, slots: { include: { streamer: true }, orderBy: { startTime: "asc" } } },
  });
  if (!shift) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ shift });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const current = await prisma.liveShift.findUnique({ where: { id: params.id } });
  if (!current) return NextResponse.json({ error: "ไม่พบกะ" }, { status: 404 });

  const body = await req.json();
  const parsed = await parseShiftBody(body, true, {
    date: current.date,
    streamerId: current.streamerId,
    channelId: current.channelId,
    startTime: current.startTime,
    endTime: current.endTime,
    note: current.note,
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const conflict = await checkShiftConflicts(parsed.data, params.id);
  if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

  await prisma.liveShift.update({ where: { id: params.id }, data: parsed.data });
  await attachShiftToSession(params.id, staff.staffId); // วัน/ช่องทางเปลี่ยน -> ย้ายไปรอบที่ถูกต้อง พร้อมยอดที่กรอกไว้
  const shift = await prisma.liveShift.findUniqueOrThrow({ where: { id: params.id }, include: { streamer: true, channel: true, slots: true } });
  return NextResponse.json({ shift });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ยอดที่กรอกไว้ (slots) ยังอยู่ในรอบไลฟ์ของวันนั้น แค่หลุดจากกะ (shiftId -> null)
  const existing = await prisma.liveShift.findUnique({ where: { id: params.id }, select: { sessionId: true } });
  await prisma.liveShift.delete({ where: { id: params.id } });
  await syncSessionTimes(existing?.sessionId);
  return NextResponse.json({ ok: true });
}
