import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { parseDateOnly, normalizeTime, optionalText } from "@/lib/validation";
import { toRange } from "@/lib/schedule";

/** บล็อกเวลา unavailable บนตาราง (ผู้จัดการขึ้นไป) */
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const from = parseDateOnly(req.nextUrl.searchParams.get("from"));
  const to = parseDateOnly(req.nextUrl.searchParams.get("to"));
  const blocks = await prisma.scheduleBlock.findMany({
    where: { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
    include: { channel: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const date = parseDateOnly(body.date);
  if (!date) return NextResponse.json({ error: "กรุณาระบุวันที่" }, { status: 400 });
  const startTime = normalizeTime(body.startTime);
  const endTime = normalizeTime(body.endTime);
  const range = startTime && endTime ? toRange(startTime, endTime) : null;
  if (!startTime || !endTime || !range) return NextResponse.json({ error: "เวลาไม่ถูกต้อง" }, { status: 400 });
  if (range.e - range.s > 24 * 60) return NextResponse.json({ error: "บล็อกได้ไม่เกิน 24 ชั่วโมง" }, { status: 400 });

  const channelId = typeof body.channelId === "string" && body.channelId ? body.channelId : null;
  if (channelId) {
    const ch = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!ch) return NextResponse.json({ error: "ไม่พบช่องทาง" }, { status: 400 });
  }
  const label = optionalText(body.label) ?? "unavailable";

  const block = await prisma.scheduleBlock.create({
    data: { date, startTime, endTime, channelId, label: label.slice(0, 40), note: optionalText(body.note), createdByStaffId: staff.staffId },
    include: { channel: true },
  });
  return NextResponse.json({ block });
}
