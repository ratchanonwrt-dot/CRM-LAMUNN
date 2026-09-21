import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

const KEYS = ["cateringMinWithBooth", "cateringMinNoBooth"] as const;

export async function GET() {
  const staff = await requireSectionApi("CATERING", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.setting.findMany({ where: { key: { in: [...KEYS] } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return NextResponse.json({
    minWithBooth: Number(map.cateringMinWithBooth ?? 10000),
    minNoBooth: Number(map.cateringMinNoBooth ?? 6000),
  });
}

export async function PATCH(req: NextRequest) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { minWithBooth, minNoBooth } = body;

  await Promise.all([
    ...(minWithBooth !== undefined
      ? [prisma.setting.upsert({ where: { key: "cateringMinWithBooth" }, update: { value: String(minWithBooth) }, create: { key: "cateringMinWithBooth", value: String(minWithBooth) } })]
      : []),
    ...(minNoBooth !== undefined
      ? [prisma.setting.upsert({ where: { key: "cateringMinNoBooth" }, update: { value: String(minNoBooth) }, create: { key: "cateringMinNoBooth", value: String(minNoBooth) } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
