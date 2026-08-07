import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Dedicated fast-entry flow: staff type a customer's phone + a point count + which
// branch, no need to search the full customer list first. Uses ADJUST (not EARN) so
// it doesn't get counted as a "purchase" in customer analytics — same ledger type as
// the existing "ปรับแต้ม" tool, just phone-first and give-only.
const schema = z.object({
  phone: z.string().min(1),
  points: z.coerce.number().int().positive(),
  branchId: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "STAFF", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const branch = await prisma.branch.findUnique({ where: { id: parsed.data.branchId } });
  if (!branch || !branch.isActive) return NextResponse.json({ error: "ไม่พบสาขานี้ในระบบ" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { phone: parsed.data.phone } });
  if (!customer) {
    return NextResponse.json({ error: "ไม่พบลูกค้าเบอร์นี้ในระบบ กรุณาให้ลูกค้าสมัครสมาชิกก่อน (สแกน QR หรือเข้าสู่ระบบด้วยเบอร์โทร)" }, { status: 404 });
  }

  const { points, note } = parsed.data;

  const [, updatedCustomer] = await prisma.$transaction([
    prisma.pointTransaction.create({
      data: {
        customerId: customer.id,
        branchId: branch.id,
        type: "ADJUST",
        points,
        note: note ? `กรอกคะแนนโดยพนักงาน — ${note}` : "กรอกคะแนนโดยพนักงาน",
        processedByStaffId: staff.staffId,
      },
    }),
    prisma.customer.update({
      where: { id: customer.id },
      data: { pointsBalance: { increment: points }, lifetimePoints: { increment: points } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    customerName: customer.name ?? customer.phone,
    pointsBalance: updatedCustomer.pointsBalance,
  });
}
