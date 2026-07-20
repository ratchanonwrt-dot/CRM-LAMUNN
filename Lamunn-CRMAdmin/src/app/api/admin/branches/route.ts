import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  try {
    const branch = await prisma.branch.create({
      data: { ...parsed.data, code: parsed.data.code.toUpperCase() },
    });
    return NextResponse.json({ ok: true, branch });
  } catch {
    return NextResponse.json({ error: "รหัสสาขานี้มีอยู่แล้ว" }, { status: 409 });
  }
}
