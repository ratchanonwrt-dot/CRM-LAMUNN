import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { formatThaiDate } from "@/lib/format";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("EVENTS", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.eventSale.delete({ where: { id: params.id } });
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "DELETE",
    entity: "EventSale",
    summary: `ลบ Event ชั่วคราว — ${existing.name} (${formatThaiDate(existing.startDate)})`,
  });
  return NextResponse.json({ ok: true });
}
