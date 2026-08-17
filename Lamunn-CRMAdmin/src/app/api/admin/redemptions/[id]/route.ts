import { NextRequest, NextResponse } from "next/server";
import { prisma, logAudit, customerDisplayName } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Undo a redemption that was mis-scanned/mis-confirmed by staff, whether it's
// still PENDING or already COMPLETED. Points were deducted (and reward.stock
// decremented) at the moment the customer requested the redemption — not at
// confirm — so deleting always needs to reverse both, regardless of status.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["STAFF", "SUPERVISOR", "SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const redemption = await prisma.redemption.findUnique({ where: { id: params.id }, include: { reward: true, customer: true } });
  if (!redemption) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

  await prisma.$transaction([
    prisma.redemption.delete({ where: { id: redemption.id } }),
    prisma.customer.update({
      where: { id: redemption.customerId },
      data: { pointsBalance: { increment: redemption.pointsSpent } },
    }),
    ...(redemption.reward && redemption.reward.stock !== null
      ? [prisma.reward.update({ where: { id: redemption.rewardId! }, data: { stock: { increment: 1 } } })]
      : []),
  ]);

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "Redemption",
    entityId: redemption.id,
    summary: `ลบรายการแลกรางวัล "${redemption.reward?.name ?? redemption.rewardName}" ของ ${customerDisplayName({ ...redemption.customer, phone: redemption.customer.phone ?? redemption.customerId })}${
      redemption.pointsSpent > 0 ? ` (คืน ${redemption.pointsSpent} แต้ม)` : ""
    }`,
  });

  return NextResponse.json({ ok: true });
}
