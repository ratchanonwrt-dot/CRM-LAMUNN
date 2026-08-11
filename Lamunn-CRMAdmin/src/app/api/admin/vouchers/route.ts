import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Creates a VOUCHER-kind catalog item — separate from POST /api/admin/rewards
// (kind=REWARD) so vouchers never show up in the customer app's self-service,
// points-redeemable catalog. Vouchers are only ever handed to a customer directly
// via /admin/vouchers (grant by phone), never bought with points.
const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().url().optional(),
  discountPercent: z.coerce.number().int().min(1).max(100).optional(),
  discountMaxAmount: z.coerce.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const voucher = await prisma.reward.create({
    data: {
      kind: "VOUCHER",
      name: parsed.data.name,
      description: parsed.data.description,
      pointsCost: null,
      stock: parsed.data.stock ?? null,
      imageUrl: parsed.data.imageUrl,
      discountPercent: parsed.data.discountPercent ?? null,
      discountMaxAmount: parsed.data.discountMaxAmount ?? null,
    },
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "Voucher",
    entityId: voucher.id,
    summary: `สร้างวอเชอร์ใหม่ "${voucher.name}"`,
  });

  return NextResponse.json({ ok: true, voucher });
}
