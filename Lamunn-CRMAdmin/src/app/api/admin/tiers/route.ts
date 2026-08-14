import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1),
  minPoints: z.coerce.number().int().min(0),
  benefit: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().optional(),
  maintenanceSpendThreshold: z.coerce.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const tier = await prisma.membershipTier.create({
    data: {
      name: parsed.data.name,
      minPoints: parsed.data.minPoints,
      benefit: parsed.data.benefit,
      imageUrl: parsed.data.imageUrl,
      sortOrder: parsed.data.sortOrder ?? parsed.data.minPoints,
      maintenanceSpendThreshold: parsed.data.maintenanceSpendThreshold ?? null,
    },
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "MembershipTier",
    entityId: tier.id,
    summary: `สร้างระดับสมาชิกใหม่ "${tier.name}" (${tier.minPoints} แต้ม)`,
  });

  return NextResponse.json({ ok: true, tier });
}
