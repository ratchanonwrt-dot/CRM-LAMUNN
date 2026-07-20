import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["STAFF", "BRANCH_MANAGER"]);
  if (!staff || !staff.branchId) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const redemption = await prisma.redemption.findUnique({ where: { id: params.id } });
  if (!redemption) return NextResponse.json({ error: "ไม่พบรายการแลกรางวัลนี้" }, { status: 404 });
  if (redemption.status !== "PENDING") {
    return NextResponse.json({ error: "รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว" }, { status: 409 });
  }

  const updated = await prisma.redemption.update({
    where: { id: params.id },
    data: { status: "COMPLETED", branchId: staff.branchId, fulfilledByStaffId: staff.staffId },
  });

  return NextResponse.json({ ok: true, redemption: updated });
}
