import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireStaff } from "@/lib/requireStaff";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const branch = await prisma.branch.findUnique({
    where: { id: params.id },
    include: { rentConfig: true, creditTermConfig: true },
  });
  if (!branch) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ branch });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, isActive, sortOrder, rent, creditTerm } = body;

  const branch = await prisma.branch.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
    },
  });

  if (rent) {
    await prisma.rentConfig.upsert({
      where: { branchId: branch.id },
      update: {
        rentType: rent.rentType,
        gpPercentStorefront: Number(rent.gpPercentStorefront) || 0,
        gpPercentDelivery: Number(rent.gpPercentDelivery) || 0,
        fixRateAmount: rent.fixRateAmount === "" || rent.fixRateAmount === undefined ? null : Number(rent.fixRateAmount),
        minAmount: rent.minAmount === "" || rent.minAmount === undefined ? null : Number(rent.minAmount),
        vendorFeeMonthly: Number(rent.vendorFeeMonthly) || 0,
        note: rent.note || null,
      },
      create: {
        branchId: branch.id,
        rentType: rent.rentType,
        gpPercentStorefront: Number(rent.gpPercentStorefront) || 0,
        gpPercentDelivery: Number(rent.gpPercentDelivery) || 0,
        fixRateAmount: rent.fixRateAmount === "" || rent.fixRateAmount === undefined ? null : Number(rent.fixRateAmount),
        minAmount: rent.minAmount === "" || rent.minAmount === undefined ? null : Number(rent.minAmount),
        vendorFeeMonthly: Number(rent.vendorFeeMonthly) || 0,
        note: rent.note || null,
      },
    });
  }

  if (creditTerm && branch.type === "CREDIT_TERM") {
    await prisma.creditTermCycleConfig.upsert({
      where: { branchId: branch.id },
      update: {
        splitMonth: !!creditTerm.splitMonth,
        period1PayDay: creditTerm.period1PayDay === "" ? null : Number(creditTerm.period1PayDay),
        period1PayMonthOffset: Number(creditTerm.period1PayMonthOffset) || 0,
        period2PayDay: creditTerm.period2PayDay === "" ? null : Number(creditTerm.period2PayDay),
        period2PayMonthOffset: Number(creditTerm.period2PayMonthOffset) || 0,
        fullMonthPayDay: creditTerm.fullMonthPayDay === "" ? null : Number(creditTerm.fullMonthPayDay),
        fullMonthPayMonthOffset: Number(creditTerm.fullMonthPayMonthOffset) || 0,
        deductDeliveryGp: !!creditTerm.deductDeliveryGp,
      },
      create: {
        branchId: branch.id,
        splitMonth: !!creditTerm.splitMonth,
        period1PayDay: creditTerm.period1PayDay === "" ? null : Number(creditTerm.period1PayDay),
        period1PayMonthOffset: Number(creditTerm.period1PayMonthOffset) || 0,
        period2PayDay: creditTerm.period2PayDay === "" ? null : Number(creditTerm.period2PayDay),
        period2PayMonthOffset: Number(creditTerm.period2PayMonthOffset) || 0,
        fullMonthPayDay: creditTerm.fullMonthPayDay === "" ? null : Number(creditTerm.fullMonthPayDay),
        fullMonthPayMonthOffset: Number(creditTerm.fullMonthPayMonthOffset) || 0,
        deductDeliveryGp: !!creditTerm.deductDeliveryGp,
      },
    });
  }

  const updated = await prisma.branch.findUnique({
    where: { id: branch.id },
    include: { rentConfig: true, creditTermConfig: true },
  });
  return NextResponse.json({ branch: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff(["ADMIN"]);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await prisma.branch.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
