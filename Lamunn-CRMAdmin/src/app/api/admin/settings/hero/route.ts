import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setHeroImageUrl } from "@lamunn/db";
import { requireStaff } from "@/lib/requireStaff";

const schema = z.object({ heroImageUrl: z.string().url().nullable() });

export async function PATCH(req: NextRequest) {
  const staff = await requireStaff(["SUPER_ADMIN"]);
  if (!staff) return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const settings = await setHeroImageUrl(parsed.data.heroImageUrl);
  return NextResponse.json({ ok: true, settings });
}
