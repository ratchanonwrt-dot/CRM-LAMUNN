import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateBranches } from "@/lib/branchCache";

export async function GET() {
  const staff = await requireSectionApi("BRANCHES", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({
    orderBy: { sortOrder: "asc" },
    include: { rentConfig: true, creditTermConfig: true },
  });
  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("BRANCHES", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, name, type, sortOrder, posCode } = body;
  if (!code || !name || !type) return NextResponse.json({ error: "code, name and type are required" }, { status: 400 });

  const branch = await prisma.branch.create({
    data: {
      code,
      name,
      type,
      sortOrder: sortOrder ?? 0,
      posCode: posCode || null,
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

  revalidateBranches(); // ล้างแคชรายชื่อสาขา/ค่าตั้งค่าสาขา ให้ทุกหน้าเห็นค่าใหม่ทันที

  return NextResponse.json({ branch });
}
