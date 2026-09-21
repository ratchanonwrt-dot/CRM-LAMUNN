import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function GET() {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const groups = await prisma.billingGroup.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const maxSort = await prisma.billingGroup.aggregate({ _max: { sortOrder: true } });
  const group = await prisma.billingGroup.create({
    data: { name, sortOrder: (maxSort._max.sortOrder ?? 0) + 1 },
  });
  return NextResponse.json({ group });
}
