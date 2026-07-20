import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pointsCost: z.coerce.number().int().positive(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const reward = await prisma.reward.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      pointsCost: parsed.data.pointsCost,
      stock: parsed.data.stock ?? null,
      imageUrl: parsed.data.imageUrl,
    },
  });
  return NextResponse.json({ ok: true, reward });
}
