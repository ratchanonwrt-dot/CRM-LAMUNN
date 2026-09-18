import { NextRequest } from "next/server";
import { prisma, Prisma, RedemptionStatus } from "@lamunn/db";
import { withApiKey, ok, pagination, dateRange, digitsOnly, redemptionInclude, serializeRedemption } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/redemptions?status=&branch=&reward=&phone=&from=&to=&page=&pageSize= — reward / coupon usage across all customers. */
export const GET = withApiKey(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, skip, take } = pagination(sp);
  const status = sp.get("status")?.toUpperCase();
  const branch = sp.get("branch");
  const reward = sp.get("reward");
  const phone = sp.get("phone");
  // Completed coupons are dated by the confirmation (updatedAt); everything else by when it was requested.
  const range = dateRange(sp);
  const where: Prisma.RedemptionWhereInput = {
    ...(status && status in RedemptionStatus ? { status: status as RedemptionStatus } : {}),
    ...(branch ? { branch: { OR: [{ code: { equals: branch, mode: "insensitive" } }, { name: { contains: branch, mode: "insensitive" } }] } } : {}),
    ...(reward ? { rewardName: { contains: reward, mode: "insensitive" } } : {}),
    ...(phone ? { customer: { phone: { contains: digitsOnly(phone) } } } : {}),
    ...(range ? (status === "COMPLETED" ? { updatedAt: range } : { createdAt: range }) : {}),
  };
  const [total, rows, byStatus] = await Promise.all([
    prisma.redemption.count({ where }),
    prisma.redemption.findMany({ where, include: redemptionInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.redemption.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);
  return ok({ page, pageSize, total, byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])), data: rows.map(serializeRedemption) });
});
