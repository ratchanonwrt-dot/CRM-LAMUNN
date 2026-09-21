import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branchId = req.nextUrl.searchParams.get("branchId");
  if (!branchId) return NextResponse.json({ error: "branchId is required" }, { status: 400 });

  const history = await prisma.gpRateHistory.findMany({
    where: { branchId },
    orderBy: [{ effectiveYear: "desc" }, { effectiveMonth: "desc" }],
  });
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, effectiveYear, effectiveMonth, gpPercentStorefront, gpPercentDelivery, note } = body;
  if (!branchId || !effectiveYear || !effectiveMonth) {
    return NextResponse.json({ error: "branchId, effectiveYear and effectiveMonth are required" }, { status: 400 });
  }

  const entry = await prisma.gpRateHistory.upsert({
    where: { branchId_effectiveYear_effectiveMonth: { branchId, effectiveYear: Number(effectiveYear), effectiveMonth: Number(effectiveMonth) } },
    update: {
      gpPercentStorefront: Number(gpPercentStorefront) || 0,
      gpPercentDelivery: Number(gpPercentDelivery) || 0,
      note: note || null,
    },
    create: {
      branchId,
      effectiveYear: Number(effectiveYear),
      effectiveMonth: Number(effectiveMonth),
      gpPercentStorefront: Number(gpPercentStorefront) || 0,
      gpPercentDelivery: Number(gpPercentDelivery) || 0,
      note: note || null,
    },
  });
  return NextResponse.json({ entry });
}
