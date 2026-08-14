import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1).optional(),
  minPoints: z.coerce.number().int().min(0).optional(),
  benefit: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  maintenanceSpendThreshold: z.coerce.number().min(0).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const tier = await prisma.membershipTier.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "MembershipTier",
    entityId: tier.id,
    summary: `แก้ไขระดับสมาชิก "${tier.name}"`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, tier });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.membershipTier.findUnique({ where: { id: params.id } });
  await prisma.membershipTier.delete({ where: { id: params.id } });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "MembershipTier",
    entityId: params.id,
    summary: `ลบระดับสมาชิก "${existing?.name ?? params.id}"`,
  });

  return NextResponse.json({ ok: true });
}
