import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireOwner } from "@/lib/requireStaff";

const SETTING_KEY = "companyTiktokOutstanding";

export async function POST(req: NextRequest) {
  const staff = await requireOwner();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { amount } = body;
  if (amount === undefined || amount === "") {
    return NextResponse.json({ error: "amount is required" }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: String(Number(amount)) },
    create: { key: SETTING_KEY, value: String(Number(amount)) },
  });

  return NextResponse.json({ ok: true });
}
