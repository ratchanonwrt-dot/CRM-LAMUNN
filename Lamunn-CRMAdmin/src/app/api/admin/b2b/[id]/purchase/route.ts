import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const customer = await prisma.b2BCustomer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });

  const { amount, note } = parsed.data;

  const [, updatedCustomer] = await prisma.$transaction([
    prisma.b2BPurchase.create({
      data: {
        b2bCustomerId: customer.id,
        amount,
        note: note || null,
        processedByStaffId: staff.staffId,
      },
    }),
    prisma.b2BCustomer.update({
      where: { id: customer.id },
      data: { totalSpend: { increment: amount } },
    }),
  ]);

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "CREATE",
    entityType: "B2BPurchase",
    entityId: customer.id,
    summary: `บันทึกยอดซื้อ ${amount.toLocaleString("th-TH")} บาท ให้ "${customer.companyName}"`,
  });

  return NextResponse.json({ ok: true, totalSpend: updatedCustomer.totalSpend });
}
