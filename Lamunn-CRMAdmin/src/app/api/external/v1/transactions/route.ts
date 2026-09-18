import { NextRequest } from "next/server";
import { prisma, Prisma, TransactionType } from "@lamunn/db";
import { withApiKey, ok, pagination, dateRange, digitsOnly, transactionInclude, serializeTransaction } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/transactions?branch=&type=&from=&to=&phone=&receiptNo=&minAmount=&page=&pageSize= — the points ledger across all customers. */
export const GET = withApiKey(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, skip, take } = pagination(sp);
  const type = sp.get("type")?.toUpperCase();
  const branch = sp.get("branch");
  const phone = sp.get("phone");
  const receiptNo = sp.get("receiptNo");
  const minAmount = Number(sp.get("minAmount"));
  const where: Prisma.PointTransactionWhereInput = {
    ...(type && type in TransactionType ? { type: type as TransactionType } : {}),
    ...(branch ? { branch: { OR: [{ code: { equals: branch, mode: "insensitive" } }, { name: { contains: branch, mode: "insensitive" } }] } } : {}),
    ...(phone ? { customer: { phone: { contains: digitsOnly(phone) } } } : {}),
    ...(receiptNo ? { receiptNo } : {}),
    ...(minAmount > 0 ? { amount: { gte: minAmount } } : {}),
    ...(dateRange(sp) ? { createdAt: dateRange(sp) } : {}),
  };
  const [total, rows, sums] = await Promise.all([
    prisma.pointTransaction.count({ where }),
    prisma.pointTransaction.findMany({ where, include: transactionInclude, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.pointTransaction.aggregate({ where, _sum: { points: true, amount: true } }),
  ]);
  return ok({ page, pageSize, total, totals: { points: sums._sum.points ?? 0, amount: Number(sums._sum.amount ?? 0) }, data: rows.map(serializeTransaction) });
});
