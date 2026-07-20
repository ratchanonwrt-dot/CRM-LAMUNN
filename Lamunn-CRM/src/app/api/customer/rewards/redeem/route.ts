import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints } from "@lamunn/db";

const schema = z.object({ rewardId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.customerId) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const customerId = session.user.customerId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  await expireOldPoints(customerId);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [reward, customer] = await Promise.all([
        tx.reward.findUnique({ where: { id: parsed.data.rewardId } }),
        tx.customer.findUnique({ where: { id: customerId } }),
      ]);

      if (!reward || !reward.isActive) throw new Error("ไม่พบรางวัลนี้");
      if (reward.stock !== null && reward.stock <= 0) throw new Error("รางวัลนี้หมดแล้ว");
      if (!customer || customer.pointsBalance < reward.pointsCost) throw new Error("แต้มสะสมไม่เพียงพอ");

      await tx.customer.update({
        where: { id: customerId },
        data: { pointsBalance: { decrement: reward.pointsCost } },
      });

      if (reward.stock !== null) {
        await tx.reward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } });
      }

      const redemption = await tx.redemption.create({
        data: {
          customerId,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          status: "PENDING",
        },
      });

      await tx.pointTransaction.create({
        data: {
          customerId,
          // branchId left null: this redemption isn't tied to a branch until a
          // staff member fulfils it in-store (see Redemption.branchId at that point).
          type: "REDEEM",
          points: -reward.pointsCost,
          note: `แลกรางวัล: ${reward.name} (redemptionId=${redemption.id})`,
        },
      });

      return redemption;
    });

    return NextResponse.json({ ok: true, redemptionId: result.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" }, { status: 400 });
  }
}
