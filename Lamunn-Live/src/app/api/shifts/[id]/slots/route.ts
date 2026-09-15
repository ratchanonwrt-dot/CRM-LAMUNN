import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES } from "@/lib/requireStaff";
import { parseSlotBody } from "@/lib/validation";
import { attachShiftToSession } from "@/lib/shiftSession";

/** กรอกยอดจริงของกะ — สร้าง LiveSlot ผูกกับกะ และผูกกับรอบไลฟ์ (LiveSession) ของวัน/ช่องทางนั้น (สร้างให้ถ้ายังไม่มี) */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const shift = await prisma.liveShift.findUnique({ where: { id: params.id } });
  if (!shift) return NextResponse.json({ error: "ไม่พบกะ" }, { status: 404 });

  const body = await req.json();
  if (body.streamerId === undefined || body.streamerId === "") body.streamerId = shift.streamerId;
  const { data, errors } = parseSlotBody(body, false);
  if (errors.length) return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  const streamer = await prisma.streamer.findUnique({ where: { id: data.streamerId! } });
  if (!streamer) return NextResponse.json({ error: "ไม่พบคนไลฟ์ที่เลือก" }, { status: 400 });

  const sessionId = await attachShiftToSession(shift.id, staff.staffId);

  const slot = await prisma.liveSlot.create({
    data: {
      sessionId,
      shiftId: shift.id,
      streamerId: data.streamerId!,
      startTime: data.startTime!,
      endTime: data.endTime!,
      viewers: data.viewers ?? null,
      peakViewers: data.peakViewers ?? null,
      sales: data.sales ?? 0,
      orders: data.orders ?? null,
      note: data.note ?? null,
    },
    include: { streamer: true },
  });
  return NextResponse.json({ slot });
}
