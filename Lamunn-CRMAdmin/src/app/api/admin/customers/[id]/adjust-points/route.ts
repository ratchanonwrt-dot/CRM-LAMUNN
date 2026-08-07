import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  points: z.coerce.number().int().refine((n) => n !== 0, "จำนวนแต้มต้องไม่เป็น 0"),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });

  const { points, note } = parsed.data;
  if (points < 0 && customer.pointsBalance + points < 0) {
    return NextResponse.json({ error: "แต้มคงเหลือไม่พอสำหรับการหักแต้มนี้" }, { status: 400 });
  }

  const [, updatedCustomer] = await prisma.$transaction([
    prisma.pointTransaction.create({
      data: {
        customerId: customer.id,
        type: "ADJUST",
        points,
        note: note || null,
        processedByStaffId: staff.staffId,
        branchId: staff.branchId ?? undefined,
      },
    }),
    prisma.customer.update({
      where: { id: customer.id },
      data: {
        pointsBalance: { increment: points },
        ...(points > 0 ? { lifetimePoints: { increment: points } } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true, pointsBalance: updatedCustomer.pointsBalance });
}
