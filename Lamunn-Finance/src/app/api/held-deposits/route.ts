import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";

export async function GET() {
  const staff = await requireSectionApi("HELD_DEPOSITS", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const deposits = await prisma.heldDeposit.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ deposits });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("HELD_DEPOSITS", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { location, amount, note, depositedAt, status, vatType } = body;
  if (!location || amount === undefined || amount === "") {
    return NextResponse.json({ error: "location and amount are required" }, { status: 400 });
  }
  const VAT_TYPES = ["INCLUDES_VAT", "EXCLUDES_VAT", "NO_VAT"];
  if (vatType && !VAT_TYPES.includes(vatType)) {
    return NextResponse.json({ error: "invalid vatType" }, { status: 400 });
  }

  const deposit = await prisma.heldDeposit.create({
    data: {
      location,
      amount: Number(amount),
      note: note || null,
      depositedAt: depositedAt ? parseDateOnly(depositedAt) : null,
      status: status || undefined,
      vatType: vatType || null,
    },
  });

  return NextResponse.json({ deposit });
}
