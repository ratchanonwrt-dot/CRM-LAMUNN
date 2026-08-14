import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";

const schema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["FEMALE", "MALE", "LGBTQ", "UNSPECIFIED"]).optional(),
  consented: z.literal(true).optional(),
  tosConsented: z.literal(true).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.customerId) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const dateOfBirth = new Date(parsed.data.dateOfBirth);
  if (Number.isNaN(dateOfBirth.getTime())) {
    return NextResponse.json({ error: "วันเกิดไม่ถูกต้อง" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.user.customerId } });
  if (!customer) return NextResponse.json({ error: "ไม่พบข้อมูลลูกค้า" }, { status: 404 });

  // pdpa/tos consent are still required the very first time, but not re-asked on
  // the birthday re-confirmation prompt for a customer who already consented.
  if (!customer.pdpaConsentedAt && !parsed.data.consented) {
    return NextResponse.json({ error: "กรุณายอมรับเงื่อนไขการใช้ข้อมูล" }, { status: 400 });
  }
  if (!customer.tosConsentedAt && !parsed.data.tosConsented) {
    return NextResponse.json({ error: "กรุณายอมรับข้อกำหนดการใช้บริการ" }, { status: 400 });
  }

  // Date of birth can only ever be set once by the customer — after that, only
  // staff can correct it, to stop birthday-month promo abuse (re-rolling DOB
  // every year to farm the reward multiple times).
  const dobLocked = customer.dateOfBirthConfirmedAt !== null;

  await prisma.customer.update({
    where: { id: session.user.customerId },
    data: {
      name: parsed.data.name,
      gender: parsed.data.gender,
      ...(dobLocked ? {} : { dateOfBirth, dateOfBirthConfirmedAt: new Date() }),
      ...(customer.pdpaConsentedAt ? {} : { pdpaConsentedAt: new Date() }),
      ...(customer.tosConsentedAt ? {} : { tosConsentedAt: new Date() }),
    },
  });

  return NextResponse.json({ ok: true });
}
