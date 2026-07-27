import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";
import { parseDateOnly } from "@/lib/dates";

// Manual / carried-over receivable entries not tied to a computed period —
// e.g. balances owed from before this system started.
export async function POST(req: NextRequest) {
  const staff = await requireStaff();
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

  return NextResponse.json({ payment });
}
