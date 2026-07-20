import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"]),
  branchId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN", "BRANCH_MANAGER"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Branch managers may only create STAFF within their own branch.
  if (staff.role === "BRANCH_MANAGER") {
    if (parsed.data.role !== "STAFF" || parsed.data.branchId !== staff.branchId) {
      return NextResponse.json({ error: "ผู้จัดการสาขาสร้างได้เฉพาะพนักงานในสาขาตนเอง" }, { status: 403 });
    }
  }

  if (parsed.data.role !== "SUPER_ADMIN" && !parsed.data.branchId) {
    return NextResponse.json({ error: "กรุณาเลือกสาขา" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    const created = await prisma.staffUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        branchId: parsed.data.role === "SUPER_ADMIN" ? null : parsed.data.branchId,
      },
    });
    return NextResponse.json({ ok: true, staffId: created.id });
  } catch {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้ไปแล้ว" }, { status: 409 });
  }
}
