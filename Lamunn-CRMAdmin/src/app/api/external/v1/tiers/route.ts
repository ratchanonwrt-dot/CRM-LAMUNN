import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db";
import { withApiKey, ok, num } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/tiers — membership tier definitions with how many customers sit in each. */
export const GET = withApiKey(async (_req: NextRequest) => {
  const [tiers, noTier] = await Promise.all([
    prisma.membershipTier.findMany({
      orderBy: { minPoints: "asc" },
      include: { _count: { select: { customersHere: true } }, voucherTemplates: { include: { reward: { select: { name: true } } }, orderBy: { sortOrder: "asc" } } },
    }),
    prisma.customer.count({ where: { currentTierId: null } }),
  ]);
  return ok({
    customersWithoutTier: noTier,
    data: tiers.map((t) => ({
      id: t.id,
      name: t.name,
      minLifetimePoints: t.minPoints,
      benefit: t.benefit,
      maintenanceSpendPer6Months: num(t.maintenanceSpendThreshold),
      customers: t._count.customersHere,
      quarterlyVouchers: t.voucherTemplates.map((v) => ({ reward: v.reward.name, quantity: v.quantity })),
    })),
  });
});
