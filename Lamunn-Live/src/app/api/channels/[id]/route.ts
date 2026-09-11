import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, sortOrder, isActive, publicBooking } = body;

  const channel = await prisma.channel.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) || 0 } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(publicBooking !== undefined ? { publicBooking: Boolean(publicBooking) } : {}),
    },
  });
  return NextResponse.json({ channel });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const used = await prisma.liveSession.count({ where: { channelId: params.id } });
  if (used > 0) {
    return NextResponse.json({ error: "ช่องทางนี้มีรอบไลฟ์อยู่แล้ว ลบไม่ได้ — ให้ปิดใช้งานแทน" }, { status: 400 });
  }
  await prisma.channel.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
