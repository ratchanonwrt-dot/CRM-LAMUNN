import { differenceInYears } from "date-fns";
import { prisma } from "@lamunn/db";
import CustomerRow from "@/components/CustomerRow";
import SortableHeader from "@/components/SortableHeader";
import { requirePageRole } from "@/lib/requirePageRole";

const SORT_FIELDS = ["name", "age", "pointsBalance", "totalSpend", "purchaseCount", "avgOrderValue", "lastPurchase", "createdAt"] as const;
type SortField = (typeof SORT_FIELDS)[number];

function isSortField(v: string | undefined): v is SortField {
  return !!v && (SORT_FIELDS as readonly string[]).includes(v);
}

export default async function CustomersPage({ searchParams }: { searchParams: { sort?: string; dir?: string } }) {
  const user = await requirePageRole("customers");
  const [customers, purchaseStats, branches] = await Promise.all([
    prisma.customer.findMany({ include: { currentTier: true } }),
    prisma.pointTransaction.groupBy({
      by: ["customerId"],
      where: { type: "EARN" },
      _count: true,
      _max: { createdAt: true },
      _sum: { amount: true },
    }),
    // SUPER_ADMIN/MARKETING/SUPERVISOR aren't tied to one branch, so they need to
    // pick which branch a manual purchase entry belongs to.
    user.role === "SUPER_ADMIN" || user.role === "MARKETING" || user.role === "SUPERVISOR"
      ? prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const statsByCustomer = new Map(purchaseStats.map((s) => [s.customerId, s]));
  const now = new Date();

  const enriched = customers.map((c) => {
    const stats = statsByCustomer.get(c.id);
    const purchaseCount = stats?._count ?? 0;
    const totalSpend = Number(stats?._sum.amount ?? 0);
    return {
      customer: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        dateOfBirth: c.dateOfBirth,
        pointsBalance: c.pointsBalance,
        currentTierName: c.currentTier?.name ?? null,
      },
      age: c.dateOfBirth ? differenceInYears(now, c.dateOfBirth) : null,
      totalSpend,
      purchaseCount,
      avgOrderValue: purchaseCount > 0 ? totalSpend / purchaseCount : 0,
      lastPurchase: stats?._max.createdAt ?? null,
      createdAt: c.createdAt,
    };
  });

  const sort: SortField = isSortField(searchParams.sort) ? searchParams.sort : "createdAt";
  const dir = searchParams.dir === "asc" ? "asc" : "desc";
  const dirMul = dir === "asc" ? 1 : -1;

  enriched.sort((a, b) => {
    const valueOf = (row: typeof a) => {
      switch (sort) {
        case "name":
          return row.customer.name ?? "";
        case "age":
          return row.age ?? -1;
        case "pointsBalance":
          return row.customer.pointsBalance;
        case "totalSpend":
          return row.totalSpend;
        case "purchaseCount":
          return row.purchaseCount;
        case "avgOrderValue":
          return row.avgOrderValue;
        case "lastPurchase":
          return row.lastPurchase?.getTime() ?? 0;
        case "createdAt":
          return row.createdAt.getTime();
      }
    };
    const av = valueOf(a);
    const bv = valueOf(b);
    if (typeof av === "string" || typeof bv === "string") return dirMul * String(av).localeCompare(String(bv));
    return dirMul * ((av as number) - (bv as number));
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ลูกค้า</h1>
      <p className="mb-6 text-sm text-gray-500">รายชื่อลูกค้าทั้งหมด {customers.length} คน — กดหัวตารางเพื่อเรียงลำดับ</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <SortableHeader field="name" label="ชื่อ" currentSort={sort} currentDir={dir} />
              <th className="px-4 py-2">เบอร์โทร</th>
              <th className="px-4 py-2">วันเกิด</th>
              <SortableHeader field="age" label="อายุ" currentSort={sort} currentDir={dir} />
              <th className="px-4 py-2">ระดับปัจจุบัน</th>
              <SortableHeader field="pointsBalance" label="แต้มสะสม" currentSort={sort} currentDir={dir} />
              <SortableHeader field="totalSpend" label="ยอดซื้อสะสม (บาท)" currentSort={sort} currentDir={dir} />
              <SortableHeader field="purchaseCount" label="จำนวนครั้งที่ซื้อ" currentSort={sort} currentDir={dir} />
              <SortableHeader field="avgOrderValue" label="เฉลี่ยต่อครั้ง (บาท)" currentSort={sort} currentDir={dir} />
              <SortableHeader field="lastPurchase" label="ซื้อล่าสุด" currentSort={sort} currentDir={dir} />
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {enriched.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีลูกค้าในระบบ
                </td>
              </tr>
            )}
            {enriched.map((row) => (
              <CustomerRow
                key={row.customer.id}
                customer={row.customer}
                age={row.age}
                totalSpend={row.totalSpend}
                purchaseCount={row.purchaseCount}
                avgOrderValue={row.avgOrderValue}
                lastPurchase={row.lastPurchase}
                branches={branches.map((b) => ({ id: b.id, name: b.name }))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
