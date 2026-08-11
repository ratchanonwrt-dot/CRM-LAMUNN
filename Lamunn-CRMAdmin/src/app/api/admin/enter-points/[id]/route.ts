import { NextRequest, NextResponse } from "next/server";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Same two note prefixes the enter-points log page filters by — keeps this
// endpoint scoped to undoing a mis-keyed enter-points entry, not a generic
// "delete any point transaction" tool (redemptions, QR-scan earns, etc. are
// untouched by this route even if someone guesses the transaction id).
const ENTER_POINTS_NOTE_PREFIX = "กรอกคะแนนโดยพนักงาน";
const ENTER_AMOUNT_NOTE_PREFIX = "กรอกยอดซื้อโดยพนักงาน (กรอกคะแนน)";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "STAFF", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const tx = await prisma.pointTransaction.findUnique({ where: { id: params.id }, include: { customer: true } });
  if (
    !tx ||
    !((tx.type === "ADJUST" && tx.note?.startsWith(ENTER_POINTS_NOTE_PREFIX)) || (tx.type === "EARN" && tx.note?.startsWith(ENTER_AMOUNT_NOTE_PREFIX)))
  ) {
    return NextResponse.json({ error: "ไม่พบรายการนี้ หรือไม่สามารถลบรายการประเภทนี้ได้" }, { status: 404 });
  }

  // Points may already be partially spent since entry — clamp at 0 rather than
  // let the reversal push the customer's balance negative.
  const newBalance = Math.max(0, tx.customer.pointsBalance - tx.points);
  const newLifetime = Math.max(0, tx.customer.lifetimePoints - tx.points);

  await prisma.$transaction([
    prisma.pointTransaction.delete({ where: { id: tx.id } }),
    prisma.customer.update({
      where: { id: tx.customerId },
      data: { pointsBalance: newBalance, lifetimePoints: newLifetime },
    }),
  ]);

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "PointTransaction",
    entityId: tx.id,
    summary: `ลบรายการกรอกคะแนนผิด — ${tx.customer.phone ?? tx.customerId} (-${tx.points} แต้ม)`,
  });

  return NextResponse.json({ ok: true });
}
