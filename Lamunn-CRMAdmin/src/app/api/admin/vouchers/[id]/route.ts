import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma, logAudit } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  discountPercent: z.coerce.number().int().min(1).max(100).nullable().optional(),
  discountMaxAmount: z.coerce.number().min(0).nullable().optional(),
  discountAmount: z.coerce.number().min(0).nullable().optional(),
  minSpendAmount: z.coerce.number().min(0).nullable().optional(),
  autoTrigger: z.enum(["WELCOME", "NEXT_PURCHASE", "BIRTHDAY_MONTH"]).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  let voucher;
  try {
    voucher = await prisma.reward.update({ where: { id: params.id, kind: "VOUCHER" }, data: parsed.data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "มีวอเชอร์อื่นตั้งเป็นคูปองอัตโนมัติประเภทนี้อยู่แล้ว — ยกเลิกที่วอเชอร์เดิมก่อน" }, { status: 409 });
    }
    throw e;
  }

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "UPDATE",
    entityType: "Voucher",
    entityId: voucher.id,
    summary: `แก้ไขวอเชอร์ "${voucher.name}"`,
    changes: parsed.data,
  });

  return NextResponse.json({ ok: true, voucher });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const existing = await prisma.reward.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "ไม่พบวอเชอร์นี้" }, { status: 404 });

  // Redemption.rewardId is ON DELETE SET NULL with a rewardName snapshot, so this
  // is safe even for vouchers customers have already received — their coupon/
  // history still shows the voucher's name, it just stops linking to the catalog.
  await prisma.reward.delete({ where: { id: params.id, kind: "VOUCHER" } });

  await logAudit({
    staffId: staff.staffId,
    staffName: staff.staffName,
    staffRole: staff.role,
    action: "DELETE",
    entityType: "Voucher",
    entityId: params.id,
    summary: `ลบวอเชอร์ "${existing?.name ?? params.id}"`,
  });

  return NextResponse.json({ ok: true });
}
