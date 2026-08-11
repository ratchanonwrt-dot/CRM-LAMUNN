import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const customer = await prisma.b2BCustomer.create({
    data: {
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      note: parsed.data.note || null,
    },
  });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "B2BCustomer",
    entityId: customer.id,
    summary: `เพิ่มลูกค้า B2B/Catering ใหม่ "${customer.companyName}"`,
  });

  return NextResponse.json({ ok: true, customer });
}
