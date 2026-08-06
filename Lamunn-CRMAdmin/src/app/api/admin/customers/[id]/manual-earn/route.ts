import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, resolvePointRule, calculatePoints, computeExpiryDate } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Manager-facing manual entry for a real purchase that never got scanned (broken QR,
// receipt printer down, etc.) — calculates points the same way the customer-facing
// /api/points/scan flow does (via the branch's configured point rule), rather than
// making the manager do the math and type a raw point count (that's what the
// separate "ปรับแต้ม" adjustment tool is for — corrections, not purchases).
const schema = z.object({
  amount: z.coerce.number().positive(),
  branchId: z.string().min(1).optional(),
  receiptNo: z.string().optional(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "BRANCH_MANAGER"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const branchId = staff.branchId ?? parsed.data.branchId;
  if (!branchId) return NextResponse.json({ error: "กรุณาเลือกสาขา" }, { status: 400 });

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch || !branch.isActive) return NextResponse.json({ error: "ไม่พบสาขานี้ในระบบ" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!customer) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });

  const { amount, receiptNo, note } = parsed.data;
  const rule = await resolvePointRule(branch.id);
  const points = rule ? calculatePoints(amount, rule) : 0;
  if (points <= 0) return NextResponse.json({ error: "ยอดซื้อไม่ถึงเกณฑ์สะสมแต้ม" }, { status: 400 });

  try {
    const [, updatedCustomer] = await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          customerId: customer.id,
          branchId: branch.id,
          type: "EARN",
          points,
          amount,
          receiptNo: receiptNo || null,
          note: note ? `กรอกยอดซื้อด้วยตนเอง — ${note}` : "กรอกยอดซื้อด้วยตนเอง",
          processedByStaffId: staff.staffId,
          expiresAt: computeExpiryDate(),
        },
      }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { pointsBalance: { increment: points }, lifetimePoints: { increment: points } },
      }),
    ]);
    return NextResponse.json({ ok: true, pointsEarned: points, pointsBalance: updatedCustomer.pointsBalance });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "เลขที่ใบเสร็จนี้ถูกใช้สะสมแต้มไปแล้ว" }, { status: 409 });
    }
    throw e;
  }
}
