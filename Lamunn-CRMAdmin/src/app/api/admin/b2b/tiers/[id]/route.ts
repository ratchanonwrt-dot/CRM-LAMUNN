import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1).optional(),
  minSpend: z.coerce.number().min(0).optional(),
  discountPercent: z.coerce.number().int().min(0).max(100).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.minSpend !== undefined) data.sortOrder = parsed.data.minSpend;

  const tier = await prisma.b2BTier.update({ where: { id: params.id }, data });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "B2BTier",
    entityId: tier.id,
    summary: `แก้ไขระดับ B2B/Catering "${tier.name}"`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, tier });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.b2BTier.findUnique({ where: { id: params.id } });
  await prisma.b2BTier.delete({ where: { id: params.id } });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "B2BTier",
    entityId: params.id,
    summary: `ลบระดับ B2B/Catering "${existing?.name ?? params.id}"`,
  });

  return NextResponse.json({ ok: true });
}
