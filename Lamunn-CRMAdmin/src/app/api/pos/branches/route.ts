import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@lamunn/db";

// Lets the POS system push branch creates/updates into the CRM automatically —
// separate from staff-authenticated /api/admin/branches, and separate from the
// signed-QR receipt flow. Auth is a single shared secret (POS_SYNC_SECRET), not
// a staff session, since the caller is a server, not a logged-in person.
const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const secret = process.env.POS_SYNC_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const code = parsed.data.code.toUpperCase();
  const branch = await prisma.branch.upsert({
    where: { code },
    update: { name: parsed.data.name, address: parsed.data.address, phone: parsed.data.phone },
    create: { ...parsed.data, code },
  });

  return NextResponse.json({ ok: true, branch });
}
