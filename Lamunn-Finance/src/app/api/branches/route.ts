import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({
    orderBy: { sortOrder: "asc" },
    include: { rentConfig: true, creditTermConfig: true },
  });
  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, name, type, sortOrder } = body;
  if (!code || !name || !type) return NextResponse.json({ error: "code, name and type are required" }, { status: 400 });

  const branch = await prisma.branch.create({
    data: {
      code,
      name,
      type,
      sortOrder: sortOrder ?? 0,
      rentConfig: { create: { rentType: "GP", gpPercentStorefront: 0, gpPercentDelivery: 0 } },
      ...(type === "CREDIT_TERM"
        ? {
            creditTermConfig: {
              create: {
                splitMonth: true,
                period1PayDay: 30,
                period1PayMonthOffset: 0,
                period2PayDay: 1,
                period2PayMonthOffset: 1,
                deductDeliveryGp: true,
              },
            },
          }
        : {}),
    },
    include: { rentConfig: true, creditTermConfig: true },
  });

  return NextResponse.json({ branch });
}
