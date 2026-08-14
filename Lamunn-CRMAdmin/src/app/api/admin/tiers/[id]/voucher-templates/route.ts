import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  rewardId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const [tier, reward] = await Promise.all([
    prisma.membershipTier.findUnique({ where: { id: params.id } }),
    prisma.reward.findUnique({ where: { id: parsed.data.rewardId } }),
  ]);
  if (!tier) return NextResponse.json({ error: "ไม่พบระดับสมาชิกนี้" }, { status: 404 });
  if (!reward || reward.kind !== "VOUCHER") return NextResponse.json({ error: "ไม่พบวอเชอร์นี้" }, { status: 404 });

  const template = await prisma.tierVoucherTemplate.create({
    data: { tierId: params.id, rewardId: parsed.data.rewardId, quantity: parsed.data.quantity },
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "TierVoucherTemplate",
    entityId: template.id,
    summary: `เพิ่มวอเชอร์ "${reward.name}" x${parsed.data.quantity} ให้ระดับ "${tier.name}" (แจกทุก 3 เดือน)`,
  });

  return NextResponse.json({ ok: true, template });
}
