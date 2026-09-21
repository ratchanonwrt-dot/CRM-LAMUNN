import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-catering";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, source, note } = body;

  const customer = await prisma.customer.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(source !== undefined ? { source: source || null } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    },
  });
  return NextResponse.json({ customer });
}
