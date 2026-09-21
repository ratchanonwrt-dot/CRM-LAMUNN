import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { formatBaht } from "@/lib/format";
import { CASH_ON_HAND_CACHE_TAG } from "@/lib/finance";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CASH_STATUS", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.cashAdjustment.delete({ where: { id: params.id } });
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "DELETE",
    entity: "CashAdjustment",
    summary: `ลบรายการปรับปรุงเงินสด — ${existing.label} (${formatBaht(existing.amount)} บาท)`,
  });
  revalidateTag(CASH_ON_HAND_CACHE_TAG); // ยอดปรับปรุงกระทบเงินสดสะสมที่ cache ไว้
  return NextResponse.json({ ok: true });
}
