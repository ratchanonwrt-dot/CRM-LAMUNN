import { NextRequest } from "next/server";
import { prisma, Prisma, RedemptionStatus } from "@lamunn/db";
import { withApiKey, ok, fail, pagination, dateRange, digitsOnly, redemptionInclude, serializeRedemption } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/customers/{id}/redemptions?status=&from=&to=&page=&pageSize= */
export const GET = withApiKey(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const key = params.id;
  const customer = await prisma.customer.findFirst({ where: /^\+?[\d\s-]{9,}$/.test(key) ? { phone: digitsOnly(key) } : { id: key }, select: { id: true } });
  if (!customer) return fail("customer not found", 404);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize, skip, take } = pagination(sp);
  const status = sp.get("status")?.toUpperCase();
  const where: Prisma.RedemptionWhereInput = {
    customerId: customer.id,
    ...(status && status in RedemptionStatus ? { status: status as RedemptionStatus } : {}),
    ...(dateRange(sp) ? { createdAt: dateRange(sp) } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.redemption.count({ where }),
    prisma.redemption.findMany({ where, include: redemptionInclude, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  return ok({ page, pageSize, total, data: rows.map(serializeRedemption) });
});
