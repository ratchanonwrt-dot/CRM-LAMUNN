import { prisma } from "@lamunn/db";
import CustomerRow from "@/components/CustomerRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function CustomersPage() {
  await requirePageRole(["SUPER_ADMIN", "BRANCH_MANAGER"]);
  const [customers, purchaseStats] = await Promise.all([
    prisma.customer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pointTransaction.groupBy({
      by: ["customerId"],
      where: { type: "EARN" },
      _count: true,
      _max: { createdAt: true },
    }),
  ]);

  const statsByCustomer = new Map(purchaseStats.map((s) => [s.customerId, s]));

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ลูกค้า</h1>
      <p className="mb-6 text-sm text-gray-500">รายชื่อลูกค้าทั้งหมด {customers.length} คน</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อ</th>
              <th className="px-4 py-2">เบอร์โทร</th>
              <th className="px-4 py-2">วันเกิด</th>
              <th className="px-4 py-2">แต้มสะสม</th>
              <th className="px-4 py-2">จำนวนครั้งที่ซื้อ</th>
              <th className="px-4 py-2">ซื้อล่าสุด</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีลูกค้าในระบบ
                </td>
              </tr>
            )}
            {customers.map((c) => {
              const stats = statsByCustomer.get(c.id);
              return (
                <CustomerRow
                  key={c.id}
                  customer={{ id: c.id, name: c.name, phone: c.phone, dateOfBirth: c.dateOfBirth, pointsBalance: c.pointsBalance }}
                  purchaseCount={stats?._count ?? 0}
                  lastPurchase={stats?._max.createdAt ?? null}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
