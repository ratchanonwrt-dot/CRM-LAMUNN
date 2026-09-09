import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { PALETTE_KEYS, pickUnusedColor } from "@/lib/schedule";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const streamers = await prisma.streamer.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ streamers });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อคนไลฟ์" }, { status: 400 });

  const used = (await prisma.streamer.findMany({ where: { isActive: true }, select: { color: true } })).map((s) => s.color);
  const color = typeof body.color === "string" && PALETTE_KEYS.includes(body.color) ? body.color : pickUnusedColor(used);
  const streamer = await prisma.streamer.create({
    data: {
      name,
      color,
      nickname: body.nickname ? String(body.nickname).trim() : null,
      note: body.note ? String(body.note).trim() : null,
      hrEmployeeId: body.hrEmployeeId ? String(body.hrEmployeeId).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      lineId: body.lineId ? String(body.lineId).trim() : null,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    },
  });
  return NextResponse.json({ streamer });
}
