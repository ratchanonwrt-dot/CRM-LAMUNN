import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db";
import { withApiKey, ok, dateRange, num } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/stats/overview?from=&to= — headline numbers for the period (all time when no range is given). */
export const GET = withApiKey(async (req: NextRequest) => {
  const range = dateRange(req.nextUrl.searchParams);
  const earnWhere = { type: "EARN" as const, voidedInPos: false, ...(range ? { createdAt: range } : {}) };
  const [customersTotal, newCustomers, earn, activeCustomers, redeemed, redemptionsCompleted, tierDist, tiers, topRewards] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: range ? { createdAt: range } : {} }),
    prisma.pointTransaction.aggregate({ where: earnWhere, _count: { _all: true }, _sum: { points: true, amount: true } }),
    prisma.pointTransaction.findMany({ where: earnWhere, distinct: ["customerId"], select: { customerId: true } }),
    prisma.pointTransaction.aggregate({ where: { type: "REDEEM", ...(range ? { createdAt: range } : {}) }, _sum: { points: true } }),
    prisma.redemption.count({ where: { status: "COMPLETED", ...(range ? { updatedAt: range } : {}) } }),
    prisma.customer.groupBy({ by: ["currentTierId"], _count: { _all: true } }),
    prisma.membershipTier.findMany({ select: { id: true, name: true } }),
    prisma.redemption.groupBy({ by: ["rewardName"], where: { status: "COMPLETED", ...(range ? { updatedAt: range } : {}) }, _count: { _all: true }, orderBy: { _count: { rewardName: "desc" } }, take: 10 }),
  ]);
  const tierName = new Map(tiers.map((t) => [t.id, t.name]));
  const visits = earn._count._all;
  const sales = num(earn._sum.amount) ?? 0;
  return ok({
    period: range ?? "all time",
    customersTotal,
    newCustomers,
    activeCustomers: activeCustomers.length,
    visits,
    salesAmount: sales,
    averageSpendPerVisit: visits ? Math.round((sales / visits) * 100) / 100 : 0,
    pointsIssued: earn._sum.points ?? 0,
    pointsRedeemed: Math.abs(redeemed._sum.points ?? 0),
    redemptionsCompleted,
    customersByTier: tierDist.map((t) => ({ tier: t.currentTierId ? (tierName.get(t.currentTierId) ?? t.currentTierId) : null, customers: t._count._all })),
    topRewards: topRewards.map((r) => ({ reward: r.rewardName, redemptions: r._count._all })),
  });
});
