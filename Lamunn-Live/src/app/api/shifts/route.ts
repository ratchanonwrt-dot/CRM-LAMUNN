import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/validation";
import { parseShiftBody, checkShiftConflicts } from "@/lib/shiftValidation";
import { attachShiftToSession } from "@/lib/shiftSession";

export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const from = parseDateOnly(req.nextUrl.searchParams.get("from"));
  const to = parseDateOnly(req.nextUrl.searchParams.get("to"));
  const shifts = await prisma.liveShift.findMany({
    where: { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
    include: { streamer: true, channel: true, slots: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ shifts });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = await parseShiftBody(body, false);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const conflict = await checkShiftConflicts(parsed.data, null);
  if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });

  const created = await prisma.liveShift.create({ data: { ...parsed.data, createdByStaffId: staff.staffId } });
  await attachShiftToSession(created.id, staff.staffId);
  const shift = await prisma.liveShift.findUniqueOrThrow({ where: { id: created.id }, include: { streamer: true, channel: true, slots: true } });
  return NextResponse.json({ shift });
}
