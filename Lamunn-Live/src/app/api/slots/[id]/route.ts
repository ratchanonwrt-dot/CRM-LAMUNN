import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, RECORDER_ROLES } from "@/lib/requireStaff";
import { parseSlotBody } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, errors } = parseSlotBody(body, true);
  if (errors.length) return NextResponse.json({ error: errors.join(", ") }, { status: 400 });

  if (data.streamerId) {
    const streamer = await prisma.streamer.findUnique({ where: { id: data.streamerId } });
    if (!streamer) return NextResponse.json({ error: "ไม่พบคนไลฟ์ที่เลือก" }, { status: 400 });
  }

  const slot = await prisma.liveSlot.update({ where: { id: params.id }, data, include: { streamer: true } });
  return NextResponse.json({ slot });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // คนกรอกหน้างานต้องลบแถวที่กรอกผิดได้เอง — slot เป็นข้อมูลชิ้นเล็ก ไม่ต้องจำกัดสิทธิ์เหมือนลบทั้งรอบ
  const staff = await requireStaff(RECORDER_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.liveSlot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
