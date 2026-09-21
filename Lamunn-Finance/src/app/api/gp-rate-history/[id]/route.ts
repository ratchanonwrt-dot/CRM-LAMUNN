import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.gpRateHistory.delete({ where: { id: params.id }, include: { branch: true } });
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "DELETE",
    entity: "GpRateHistory",
    summary: `ลบประวัติปรับ GP — ${existing.branch.name} (${existing.effectiveMonth}/${existing.effectiveYear})`,
  });
  return NextResponse.json({ ok: true });
}
