import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES, EDITOR_ROLES } from "@/lib/requireStaff";
import { parseDateOnly, optionalTime, optionalText } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const session = await prisma.liveSession.findUnique({
    where: { id: params.id },
    include: { channel: true, slots: { include: { streamer: true }, orderBy: [{ startTime: "asc" }, { createdAt: "asc" }] } },
  });
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ session });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.date !== undefined) {
    const date = parseDateOnly(body.date);
    if (!date) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    data.date = date;
  }
  if (body.startTime !== undefined) {
    const t = optionalTime(body.startTime);
    if (!t.ok) return NextResponse.json({ error: "เวลาเริ่มไม่ถูกต้อง (HH:mm)" }, { status: 400 });
    data.startTime = t.value;
  }
  if (body.endTime !== undefined) {
    const t = optionalTime(body.endTime);
    if (!t.ok) return NextResponse.json({ error: "เวลาสิ้นสุดไม่ถูกต้อง (HH:mm)" }, { status: 400 });
    data.endTime = t.value;
  }
  if (body.channelId !== undefined) {
    const channelId = typeof body.channelId === "string" && body.channelId ? body.channelId : null;
    if (channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) return NextResponse.json({ error: "ไม่พบช่องทางที่เลือก" }, { status: 400 });
    }
    data.channelId = channelId;
  }
  if (body.title !== undefined) data.title = optionalText(body.title);
  if (body.note !== undefined) data.note = optionalText(body.note);

  const session = await prisma.liveSession.update({ where: { id: params.id }, data });
  return NextResponse.json({ session });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.liveSession.delete({ where: { id: params.id } }); // slots cascade
  return NextResponse.json({ ok: true });
}
