import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  pointsCost: z.coerce.number().int().positive().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  discountPercent: z.coerce.number().int().min(1).max(100).nullable().optional(),
  discountMaxAmount: z.coerce.number().min(0).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const reward = await prisma.reward.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "Reward",
    entityId: reward.id,
    summary: `แก้ไขรางวัล "${reward.name}"`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, reward });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.reward.findUnique({ where: { id: params.id } });

  try {
    await prisma.reward.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: "ลบไม่ได้เพราะมีลูกค้าแลกรางวัลนี้ไปแล้ว ปิดใช้งานแทนได้" },
      { status: 409 }
    );
  }

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "Reward",
    entityId: params.id,
    summary: `ลบรางวัล "${existing?.name ?? params.id}"`,
  });

  return NextResponse.json({ ok: true });
}
