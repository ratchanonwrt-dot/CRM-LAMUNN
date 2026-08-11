import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Grants a reward for free (no points deducted) to a specific customer by phone —
// used to issue vouchers (lucky-draw prizes, goodwill gestures, etc). Creates a
// normal PENDING Redemption so the existing customer "My Coupons" view + staff
// scan-redemption/confirm flow both just work, with pointsSpent: 0 marking it as
// a free gift rather than a points redemption.
const schema = z.object({
  phone: z.string().min(1),
  rewardId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { phone: parsed.data.phone } });
  if (!customer) {
    return NextResponse.json({ error: "ไม่พบลูกค้าเบอร์นี้ในระบบ กรุณาให้ลูกค้าสมัครสมาชิกก่อน (สแกน QR หรือเข้าสู่ระบบด้วยเบอร์โทร)" }, { status: 404 });
  }

  const reward = await prisma.reward.findUnique({ where: { id: parsed.data.rewardId } });
  if (!reward || !reward.isActive) return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
  if (reward.stock !== null && reward.stock <= 0) return NextResponse.json({ error: "รางวัลนี้หมดแล้ว" }, { status: 400 });

  const redemption = await prisma.$transaction(async (tx) => {
    if (reward.stock !== null) {
      await tx.reward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } });
    }
    return tx.redemption.create({
      data: {
        customerId: customer.id,
        rewardId: reward.id,
        pointsSpent: 0,
        status: "PENDING",
      },
    });
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "Redemption",
    entityId: redemption.id,
    summary: `ออกวอเชอร์ "${reward.name}" ให้ ${customer.name ?? customer.phone}`,
    changes: { phone: parsed.data.phone, rewardId: reward.id },
  });

  return NextResponse.json({ ok: true, redemptionId: redemption.id, customerName: customer.name ?? customer.phone });
}
