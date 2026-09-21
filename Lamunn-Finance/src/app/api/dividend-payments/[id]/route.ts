import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireOwner } from "@/lib/requireStaff";
import { logActivity } from "@/lib/activityLog";
import { formatBaht, formatThaiDate } from "@/lib/format";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireOwner();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.dividendPayment.delete({ where: { id: params.id } });
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "DELETE",
    entity: "DividendPayment",
    summary: `ลบรายการปันผล — ${formatBaht(existing.amount)} บาท (${formatThaiDate(existing.date)})`,
  });
  return NextResponse.json({ ok: true });
}
