import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function GET() {
  const staff = await requireSectionApi("CATERING", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.cateringMenuItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, name, unitLabel, unitPrice, minPrice, sortOrder } = body;
  if (!category || !name) return NextResponse.json({ error: "category and name are required" }, { status: 400 });

  const item = await prisma.cateringMenuItem.create({
    data: {
      category,
      name,
      unitLabel: unitLabel || null,
      unitPrice: unitPrice === undefined || unitPrice === "" ? null : Number(unitPrice),
      minPrice: minPrice === undefined || minPrice === "" ? null : Number(minPrice),
      sortOrder: sortOrder ?? 0,
    },
  });
  return NextResponse.json({ item });
}
