import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  note: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const customer = await prisma.b2BCustomer.update({ where: { id: params.id }, data: parsed.data });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "B2BCustomer",
    entityId: customer.id,
    summary: `แก้ไขลูกค้า B2B/Catering "${customer.companyName}"`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, customer });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.b2BCustomer.findUnique({ where: { id: params.id } });
  await prisma.b2BPurchase.deleteMany({ where: { b2bCustomerId: params.id } });
  await prisma.b2BCustomer.delete({ where: { id: params.id } });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "B2BCustomer",
    entityId: params.id,
    summary: `ลบลูกค้า B2B/Catering "${existing?.companyName ?? params.id}"`,
  });

  return NextResponse.json({ ok: true });
}
