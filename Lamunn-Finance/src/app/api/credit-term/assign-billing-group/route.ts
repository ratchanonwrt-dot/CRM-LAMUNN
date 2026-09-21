import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateBranches } from "@/lib/branchCache";

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, billingGroupId, billingDueDays, paymentDelayDays, gpPercentStorefront, gpPercentDelivery, mallLegalName } = body;
  if (!branchId) return NextResponse.json({ error: "branchId is required" }, { status: 400 });

  const cycleData: Record<string, unknown> = {};
  if (billingGroupId !== undefined) cycleData.billingGroupId = billingGroupId || null;
  if (billingDueDays !== undefined) cycleData.billingDueDays = billingDueDays === "" || billingDueDays === null ? null : Number(billingDueDays);
  if (paymentDelayDays !== undefined)
    cycleData.paymentDelayDays = paymentDelayDays === "" || paymentDelayDays === null ? null : Number(paymentDelayDays);
  if (mallLegalName !== undefined) cycleData.mallLegalName = mallLegalName || null;

  const [config] = await prisma.$transaction([
    prisma.creditTermCycleConfig.update({ where: { branchId }, data: cycleData }),
    ...(gpPercentStorefront !== undefined || gpPercentDelivery !== undefined
      ? [
          prisma.rentConfig.update({
            where: { branchId },
            data: {
              ...(gpPercentStorefront !== undefined ? { gpPercentStorefront: Number(gpPercentStorefront) || 0 } : {}),
              ...(gpPercentDelivery !== undefined ? { gpPercentDelivery: Number(gpPercentDelivery) || 0 } : {}),
            },
          }),
        ]
      : []),
  ]);
  revalidateBranches(); // ล้างแคชรายชื่อสาขา/ค่าตั้งค่าสาขา ให้ทุกหน้าเห็นค่าใหม่ทันที
  return NextResponse.json({ config });
}
