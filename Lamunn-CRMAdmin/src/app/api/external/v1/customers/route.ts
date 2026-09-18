import { NextRequest } from "next/server";
import { prisma, Prisma } from "@lamunn/db";
import { withApiKey, ok, pagination, dateRange, digitsOnly, customerInclude, serializeCustomer } from "@/lib/externalApi";

export const dynamic = "force-dynamic";

/** GET /api/external/v1/customers?q=&phone=&tier=&registeredFrom=&registeredTo=&page=&pageSize= */
export const GET = withApiKey(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, skip, take } = pagination(sp);
  const and: Prisma.CustomerWhereInput[] = [];

  const phone = sp.get("phone");
  if (phone) and.push({ phone: { contains: digitsOnly(phone) } });

  const q = sp.get("q")?.trim();
  if (q) {
    const digits = digitsOnly(q);
    and.push(
      digits.length >= 4 && digits.length === q.replace(/[\s-]/g, "").length
        ? { phone: { contains: digits } }
        : { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: digits || q } }] }
    );
  }

  const tier = sp.get("tier");
  if (tier) and.push({ currentTier: { name: { contains: tier, mode: "insensitive" } } });

  const registered = dateRange(new URLSearchParams({ ...(sp.get("registeredFrom") ? { from: sp.get("registeredFrom")! } : {}), ...(sp.get("registeredTo") ? { to: sp.get("registeredTo")! } : {}) }));
  if (registered) and.push({ createdAt: registered });

  if (sp.get("active") === "true") and.push({ isActive: true });

  const where: Prisma.CustomerWhereInput = and.length ? { AND: and } : {};
  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, include: customerInclude, orderBy: { createdAt: "desc" }, skip, take }),
  ]);
  return ok({ page, pageSize, total, data: rows.map(serializeCustomer) });
});
