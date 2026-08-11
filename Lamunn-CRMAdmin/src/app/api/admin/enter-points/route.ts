import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma, resolvePointRule, calculatePoints, computeExpiryDate } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

// Dedicated fast-entry flow: staff type a customer's phone + which branch, no need
// to search the full customer list first. Two modes, mutually exclusive:
//  - points: a raw point count (ADJUST, no expiry) — corrections/promo giveaways,
//    same ledger type as the "ปรับแต้ม" tool, just phone-first.
//  - amount: a THB purchase amount (EARN, gets the usual 1-year expiry) — the system
//    converts it via the branch's point rule, same math as the QR-scan earn flow, for
//    a real purchase that just never got scanned.
const schema = z
  .object({
    phone: z.string().min(1),
    points: z.coerce.number().int().positive().optional(),
    amount: z.coerce.number().positive().optional(),
    branchId: z.string().min(1),
    receiptNo: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((d) => (d.points !== undefined) !== (d.amount !== undefined), {
    message: "กรอกได้อย่างใดอย่างหนึ่งระหว่างแต้มกับยอดซื้อ",
  });

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "STAFF", "MARKETING"]);
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

  const { note, receiptNo } = parsed.data;

  let points: number;
  let txData: Parameters<typeof prisma.pointTransaction.create>[0]["data"];

  if (parsed.data.amount !== undefined) {
    const rule = await resolvePointRule(branch.id);
    points = rule ? calculatePoints(parsed.data.amount, rule) : 0;
    if (points <= 0) return NextResponse.json({ error: "ยอดซื้อไม่ถึงเกณฑ์สะสมแต้ม" }, { status: 400 });
    txData = {
      customerId: customer.id,
      branchId: branch.id,
      type: "EARN",
      points,
      amount: parsed.data.amount,
      receiptNo: receiptNo || null,
      note: note ? `กรอกยอดซื้อโดยพนักงาน (กรอกคะแนน) — ${note}` : "กรอกยอดซื้อโดยพนักงาน (กรอกคะแนน)",
      processedByStaffId: staff.staffId,
      expiresAt: computeExpiryDate(),
    };
  } else {
    points = parsed.data.points!;
    txData = {
      customerId: customer.id,
      branchId: branch.id,
      type: "ADJUST",
      points,
      note: note ? `กรอกคะแนนโดยพนักงาน — ${note}` : "กรอกคะแนนโดยพนักงาน",
      processedByStaffId: staff.staffId,
    };
  }

  try {
    const [, updatedCustomer] = await prisma.$transaction([
      prisma.pointTransaction.create({ data: txData }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { pointsBalance: { increment: points }, lifetimePoints: { increment: points } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      customerName: customer.name ?? customer.phone,
      points,
      pointsBalance: updatedCustomer.pointsBalance,
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "เลขที่ใบเสร็จนี้ถูกใช้สะสมแต้มไปแล้ว" }, { status: 409 });
    }
    throw e;
  }
}
