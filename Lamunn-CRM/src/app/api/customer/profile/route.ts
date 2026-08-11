import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";

const schema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["FEMALE", "MALE", "LGBTQ", "UNSPECIFIED"]).optional(),
  consented: z.literal(true),
  tosConsented: z.literal(true),
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

  await prisma.customer.update({
    where: { id: session.user.customerId },
    data: { name: parsed.data.name, dateOfBirth, gender: parsed.data.gender, pdpaConsentedAt: new Date(), tosConsentedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
