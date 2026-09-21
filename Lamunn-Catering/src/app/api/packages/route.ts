import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const packages = await prisma.cateringPackage.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, price, sortOrder } = body;
  if (!name || price === undefined) return NextResponse.json({ error: "name and price are required" }, { status: 400 });

  const pkg = await prisma.cateringPackage.create({
    data: { name, description: description || null, price: Number(price), sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json({ package: pkg });
}
