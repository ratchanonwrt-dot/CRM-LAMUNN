import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES } from "@/lib/requireStaff";
import { parseDateOnly, optionalTime, optionalText } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const from = parseDateOnly(req.nextUrl.searchParams.get("from"));
  const to = parseDateOnly(req.nextUrl.searchParams.get("to"));

  const sessions = await prisma.liveSession.findMany({
    where: { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
    include: { channel: true, slots: { include: { streamer: true } } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = parseDateOnly(body.date);
  if (!date) return NextResponse.json({ error: "กรุณาระบุวันที่ให้ถูกต้อง" }, { status: 400 });

  const start = optionalTime(body.startTime);
  const end = optionalTime(body.endTime);
  if (!start.ok || !end.ok) return NextResponse.json({ error: "รูปแบบเวลาไม่ถูกต้อง (HH:mm)" }, { status: 400 });

  const channelId = typeof body.channelId === "string" && body.channelId ? body.channelId : null;
  if (channelId) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) return NextResponse.json({ error: "ไม่พบช่องทางที่เลือก" }, { status: 400 });
  }

  const session = await prisma.liveSession.create({
    data: {
      date,
      channelId,
      title: optionalText(body.title),
      startTime: start.value,
      endTime: end.value,
      note: optionalText(body.note),
      createdByStaffId: staff.staffId,
    },
  });
  return NextResponse.json({ session });
}
