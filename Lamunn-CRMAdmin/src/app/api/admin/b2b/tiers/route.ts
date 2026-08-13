import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1),
  minSpend: z.coerce.number().min(0),
  discountPercent: z.coerce.number().int().min(0).max(100),
  benefit: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const tier = await prisma.b2BTier.create({
    data: {
      name: parsed.data.name,
      minSpend: parsed.data.minSpend,
      discountPercent: parsed.data.discountPercent,
      benefit: parsed.data.benefit || null,
      sortOrder: parsed.data.minSpend,
    },
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "B2BTier",
    entityId: tier.id,
    summary: `สร้างระดับ B2B/Catering ใหม่ "${tier.name}" (${tier.minSpend} บาท)`,
  });

  return NextResponse.json({ ok: true, tier });
}
