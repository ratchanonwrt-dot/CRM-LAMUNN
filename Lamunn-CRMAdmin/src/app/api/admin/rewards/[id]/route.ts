import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  pointsCost: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const reward = await prisma.reward.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ ok: true, reward });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  try {
    await prisma.reward.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: "ลบไม่ได้เพราะมีลูกค้าแลกรางวัลนี้ไปแล้ว ปิดใช้งานแทนได้" },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
