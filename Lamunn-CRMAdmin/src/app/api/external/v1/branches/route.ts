import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db";
import { withApiKey, ok, dateRange, num } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/branches?from=&to= — every branch with its activity in the period (all time when no range is given). */
export const GET = withApiKey(async (req: NextRequest) => {
  const range = dateRange(req.nextUrl.searchParams);
  const earnWhere = { type: "EARN" as const, voidedInPos: false, ...(range ? { createdAt: range } : {}) };
  const [branches, earn, redeemed, customersPerBranch] = await Promise.all([
    prisma.branch.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true, address: true, phone: true, isActive: true } }),
    prisma.pointTransaction.groupBy({ by: ["branchId"], where: earnWhere, _count: { _all: true }, _sum: { points: true, amount: true } }),
    prisma.redemption.groupBy({ by: ["branchId"], where: { status: "COMPLETED", ...(range ? { updatedAt: range } : {}) }, _count: { _all: true }, _sum: { pointsSpent: true } }),
    prisma.pointTransaction.findMany({ where: earnWhere, distinct: ["branchId", "customerId"], select: { branchId: true } }),
  ]);
  const earnBy = new Map(earn.map((e) => [e.branchId, e]));
  const redBy = new Map(redeemed.map((r) => [r.branchId, r]));
  const uniqueCustomers = new Map<string | null, number>();
  for (const row of customersPerBranch) uniqueCustomers.set(row.branchId, (uniqueCustomers.get(row.branchId) ?? 0) + 1);

  return ok({
    period: range ?? "all time",
    data: branches.map((b) => {
      const e = earnBy.get(b.id);
      const r = redBy.get(b.id);
      return {
        id: b.id,
        code: b.code,
        name: b.name,
        address: b.address,
        phone: b.phone,
        isActive: b.isActive,
        visits: e?._count._all ?? 0,
        uniqueCustomers: uniqueCustomers.get(b.id) ?? 0,
        salesAmount: num(e?._sum.amount) ?? 0,
        pointsIssued: e?._sum.points ?? 0,
        redemptionsCompleted: r?._count._all ?? 0,
        pointsRedeemed: r?._sum.pointsSpent ?? 0,
      };
    }),
  });
});
