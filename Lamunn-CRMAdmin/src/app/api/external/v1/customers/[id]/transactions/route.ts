import { NextRequest } from "next/server";
import { prisma, Prisma, TransactionType } from "@lamunn/db";
import { withApiKey, ok, fail, pagination, dateRange, digitsOnly, transactionInclude, serializeTransaction } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/customers/{id}/transactions?type=&from=&to=&page=&pageSize= */
export const GET = withApiKey(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const key = params.id;
  const customer = await prisma.customer.findFirst({ where: /^\+?[\d\s-]{9,}$/.test(key) ? { phone: digitsOnly(key) } : { id: key }, select: { id: true } });
  if (!customer) return fail("customer not found", 404);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize, skip, take } = pagination(sp);
  const type = sp.get("type")?.toUpperCase();
  const where: Prisma.PointTransactionWhereInput = {
    customerId: customer.id,
    ...(type && type in TransactionType ? { type: type as TransactionType } : {}),
    ...(dateRange(sp) ? { createdAt: dateRange(sp) } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.pointTransaction.count({ where }),
    prisma.pointTransaction.findMany({ where, include: transactionInclude, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  return ok({ page, pageSize, total, data: rows.map(serializeTransaction) });
});
