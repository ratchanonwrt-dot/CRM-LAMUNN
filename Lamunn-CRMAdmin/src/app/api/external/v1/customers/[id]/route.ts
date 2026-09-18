import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db";
import { withApiKey, ok, fail, num, digitsOnly, customerInclude, serializeCustomer, transactionInclude, serializeTransaction, redemptionInclude, serializeRedemption } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/customers/{id} — `id` may be the customer id or a phone number. Profile + spend stats + recent activity. */
export const GET = withApiKey(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const key = params.id;
  const byPhone = /^\+?[\d\s-]{9,}$/.test(key);
  const customer = await prisma.customer.findFirst({ where: byPhone ? { phone: digitsOnly(key) } : { id: key }, include: customerInclude });
  if (!customer) return fail("customer not found", 404);

  const earnWhere = { customerId: customer.id, type: "EARN" as const, voidedInPos: false };
  const [earn, byBranch, recentTransactions, redemptions, redeemedAgg, redemptionCounts] = await Promise.all([
    prisma.pointTransaction.aggregate({ where: earnWhere, _count: { _all: true }, _sum: { amount: true, points: true }, _min: { createdAt: true }, _max: { createdAt: true } }),
    prisma.pointTransaction.groupBy({ by: ["branchId"], where: { ...earnWhere, branchId: { not: null } }, _count: { _all: true }, _sum: { amount: true }, orderBy: { _count: { branchId: "desc" } }, take: 5 }),
    prisma.pointTransaction.findMany({ where: { customerId: customer.id }, include: transactionInclude, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.redemption.findMany({ where: { customerId: customer.id }, include: redemptionInclude, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.pointTransaction.aggregate({ where: { customerId: customer.id, type: "REDEEM" }, _sum: { points: true } }),
    prisma.redemption.groupBy({ by: ["status"], where: { customerId: customer.id }, _count: { _all: true } }),
  ]);

  const branchIds = byBranch.map((b) => b.branchId!).filter(Boolean);
  const branches = branchIds.length ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, code: true, name: true } }) : [];
  const branchById = new Map(branches.map((b) => [b.id, b]));

  return ok({
    ...serializeCustomer(customer),
    stats: {
      visits: earn._count._all,
      totalSpend: num(earn._sum.amount) ?? 0,
      pointsEarned: earn._sum.points ?? 0,
      pointsRedeemed: Math.abs(redeemedAgg._sum.points ?? 0),
      firstVisitAt: earn._min.createdAt,
      lastVisitAt: earn._max.createdAt,
      averageSpendPerVisit: earn._count._all ? Math.round(((num(earn._sum.amount) ?? 0) / earn._count._all) * 100) / 100 : 0,
      redemptions: Object.fromEntries(redemptionCounts.map((r) => [r.status, r._count._all])),
      topBranches: byBranch.map((b) => ({ ...(branchById.get(b.branchId!) ?? { code: null, name: null }), visits: b._count._all, spend: num(b._sum.amount) ?? 0 })),
    },
    recentTransactions: recentTransactions.map(serializeTransaction),
    recentRedemptions: redemptions.map(serializeRedemption),
  });
});
