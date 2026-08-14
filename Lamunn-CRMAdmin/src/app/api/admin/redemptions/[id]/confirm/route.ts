import { NextRequest, NextResponse } from "next/server";
import { prisma, grantNextPurchaseCouponIfWelcomeUsed } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["STAFF", "SUPERVISOR", "SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  // STAFF/SUPERVISOR are tied to one branch already; HQ-level roles (no
  // branchId) must say which branch handed the reward out via the request body.
  const body = await req.json().catch(() => null);
  const branchId = staff.branchId ?? body?.branchId;
  if (!branchId) return NextResponse.json({ error: "กรุณาเลือกสาขา" }, { status: 400 });

  const redemption = await prisma.redemption.findUnique({ where: { id: params.id } });
  if (!redemption) return NextResponse.json({ error: "ไม่พบรายการแลกรางวัลนี้" }, { status: 404 });
  if (redemption.status !== "PENDING") {
    return NextResponse.json({ error: "รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว" }, { status: 409 });
  }
  if (redemption.expiresAt && redemption.expiresAt < new Date()) {
    return NextResponse.json({ error: "วอเชอร์นี้หมดอายุแล้ว" }, { status: 409 });
  }

  const updated = await prisma.redemption.update({
    where: { id: params.id },
    data: { status: "COMPLETED", branchId, fulfilledByStaffId: staff.staffId },
  });

  await grantNextPurchaseCouponIfWelcomeUsed(updated.id);

  return NextResponse.json({ ok: true, redemption: updated });
}
