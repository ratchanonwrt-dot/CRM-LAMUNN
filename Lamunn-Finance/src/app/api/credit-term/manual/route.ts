import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { CREDIT_TERM_CACHE_TAG } from "@/lib/creditTermCalc";

// Manual / carried-over receivable entries not tied to a computed period —
// e.g. balances owed from before this system started.
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, label, netAmount, dueDate, note } = body;
  if (!label || !netAmount || !dueDate) {
    return NextResponse.json({ error: "label, netAmount and dueDate are required" }, { status: 400 });
  }

  const payment = await prisma.creditTermPayment.create({
    data: {
      branchId: branchId || null,
      label,
      netAmount: Number(netAmount),
      dueDate: parseDateOnly(dueDate),
      status: "PENDING",
      note: note || null,
    },
  });

  revalidateTag(CREDIT_TERM_CACHE_TAG);
  return NextResponse.json({ payment });
}
