import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const channels = await prisma.channel.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ channels });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "กรุณาระบุชื่อช่องทาง" }, { status: 400 });

  const channel = await prisma.channel.create({
    data: { name, sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0 },
  });
  return NextResponse.json({ channel });
}
