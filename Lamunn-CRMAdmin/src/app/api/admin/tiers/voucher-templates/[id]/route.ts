import { NextRequest, NextResponse } from "next/server";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.tierVoucherTemplate.findUnique({ where: { id: params.id }, include: { reward: true, tier: true } });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

  await prisma.tierVoucherTemplate.delete({ where: { id: params.id } });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "TierVoucherTemplate",
    entityId: params.id,
    summary: `ลบวอเชอร์ "${existing.reward.name}" ออกจากระดับ "${existing.tier.name}"`,
  });

  return NextResponse.json({ ok: true });
}
