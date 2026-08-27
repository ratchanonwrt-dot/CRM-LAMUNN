import { NextRequest, NextResponse } from "next/server";
import { prisma, grantNextPurchaseCouponIfWelcomeUsed, verifyPosBillNo } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["STAFF", "SUPERVISOR", "SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  // STAFF/SUPERVISOR are tied to one branch already; HQ-level roles (no
  // branchId) must say which branch handed the reward out via the request body.
  const body = await req.json().catch(() => null);
  const branchId = staff.branchId ?? body?.branchId;
  if (!branchId) return NextResponse.json({ error: "กรุณาเลือกสาขา" }, { status: 400 });

  const redemption = await prisma.redemption.findUnique({ where: { id: params.id }, include: { reward: true } });
  if (!redemption) return NextResponse.json({ error: "ไม่พบรายการแลกรางวัลนี้" }, { status: 404 });
  if (redemption.status !== "PENDING") {
    return NextResponse.json({ error: "รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว" }, { status: 409 });
  }
  if (redemption.expiresAt && redemption.expiresAt < new Date()) {
    return NextResponse.json({ error: "วอเชอร์นี้หมดอายุแล้ว" }, { status: 409 });
  }

  // Free vouchers (a discount applied at POS, not a points-purchased physical
  // item) need a real bill number on record — it's the only thing that lets
  // the fraud check catch a staff member keying more discount into POS than
  // the voucher actually allows. Points-based reward pickups skip this.
  const posBillNo = typeof body?.posBillNo === "string" ? body.posBillNo.trim() : "";
  if (redemption.pointsSpent === 0 && !posBillNo) {
    return NextResponse.json({ error: "กรุณากรอกเลขที่บิล POS ก่อนยืนยัน" }, { status: 400 });
  }

  const updated = await prisma.redemption.update({
    where: { id: params.id },
    data: {
      status: "COMPLETED",
      branchId,
      fulfilledByStaffId: staff.staffId,
      ...(posBillNo ? { posBillNo } : {}),
    },
  });

  await grantNextPurchaseCouponIfWelcomeUsed(updated.id);

  // Real-time check against the branch's own POS data (when live) so staff
  // see right away if the bill number doesn't exist or the discount doesn't
  // match — instead of only finding out later on the fraud-check report.
  let billVerification = null;
  if (posBillNo && redemption.reward?.discountAmount != null) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (branch) {
      const result = await verifyPosBillNo(branch.code, posBillNo);
      billVerification = { ...result, expectedDiscount: Number(redemption.reward.discountAmount) };
    }
  }

  return NextResponse.json({ ok: true, redemption: updated, billVerification });
}
