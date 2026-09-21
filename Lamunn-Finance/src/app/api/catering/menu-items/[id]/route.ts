import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, name, unitLabel, unitPrice, minPrice, sortOrder, isActive } = body;

  const item = await prisma.cateringMenuItem.update({
    where: { id: params.id },
    data: {
      ...(category !== undefined ? { category } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(unitLabel !== undefined ? { unitLabel: unitLabel || null } : {}),
      ...(unitPrice !== undefined ? { unitPrice: unitPrice === "" || unitPrice === null ? null : Number(unitPrice) } : {}),
      ...(minPrice !== undefined ? { minPrice: minPrice === "" || minPrice === null ? null : Number(minPrice) } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CATERING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.cateringMenuItem.delete({ where: { id: params.id } });
  await logActivity({
    staffId: staff.staffId,
    staffName: staff.staffName,
    action: "DELETE",
    entity: "CateringMenuItem",
    summary: `ลบรายการเมนู — ${existing.name}`,
  });
  return NextResponse.json({ ok: true });
}
