import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1),
  branchId: z.string().optional(), // omit for a global default rule (SUPER_ADMIN only)
  bahtPerPoint: z.coerce.number().positive(),
  minAmount: z.coerce.number().min(0).default(0),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "SUPERVISOR", "MARKETING"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  if (staff.role === "SUPERVISOR") {
    if (!parsed.data.branchId || parsed.data.branchId !== staff.branchId) {
      return NextResponse.json({ error: "ผู้ดูแลสาขาตั้งกติกาได้เฉพาะสาขาตนเอง" }, { status: 403 });
    }
  }

  const rule = await prisma.pointRule.create({
    data: {
      name: parsed.data.name,
      branchId: parsed.data.branchId ?? null,
      bahtPerPoint: parsed.data.bahtPerPoint,
      minAmount: parsed.data.minAmount,
    },
  });
  return NextResponse.json({ ok: true, rule });
}
