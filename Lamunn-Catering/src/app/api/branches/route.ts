import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, sortOrder } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const branch = await prisma.branch.create({ data: { name, sortOrder: sortOrder ?? 0 } });
  return NextResponse.json({ branch });
}
