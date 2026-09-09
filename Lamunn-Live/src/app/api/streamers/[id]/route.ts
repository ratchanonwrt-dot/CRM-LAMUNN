import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, nickname, note, hrEmployeeId, phone, lineId, sortOrder, isActive } = body;

  const streamer = await prisma.streamer.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(nickname !== undefined ? { nickname: nickname ? String(nickname).trim() : null } : {}),
      ...(note !== undefined ? { note: note ? String(note).trim() : null } : {}),
      ...(hrEmployeeId !== undefined ? { hrEmployeeId: hrEmployeeId ? String(hrEmployeeId).trim() : null } : {}),
      ...(phone !== undefined ? { phone: phone ? String(phone).trim() : null } : {}),
      ...(lineId !== undefined ? { lineId: lineId ? String(lineId).trim() : null } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
  });
  return NextResponse.json({ streamer });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // ถ้ามีประวัติไลฟ์อยู่แล้ว ห้ามลบ (จะทำให้ข้อมูลวิเคราะห์หาย) — ให้ปิดใช้งานแทน
  const used = await prisma.liveSlot.count({ where: { streamerId: params.id } });
  if (used > 0) {
    return NextResponse.json({ error: "คนไลฟ์นี้มีประวัติการไลฟ์แล้ว ลบไม่ได้ — ให้ปิดใช้งานแทน" }, { status: 400 });
  }
  await prisma.streamer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
