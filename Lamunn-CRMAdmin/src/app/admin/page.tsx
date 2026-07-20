import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const branchId = session!.user.branchId;

  const branchFilter = role === "SUPER_ADMIN" ? {} : { branchId: branchId ?? undefined };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalCustomers, totalBranches, pointsToday, pointsAllTime, byBranch] = await Promise.all([
    prisma.customer.count(),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.pointTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN", createdAt: { gte: startOfToday }, ...branchFilter },
    }),
    prisma.pointTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN", ...branchFilter },
    }),
    prisma.branch.findMany({
      where: role === "SUPER_ADMIN" ? { isActive: true } : { id: branchId ?? undefined },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const stats = [
    { label: "ลูกค้าทั้งหมด", value: totalCustomers },
    { label: "สาขาที่เปิดใช้งาน", value: totalBranches },
    { label: "แต้มที่แจกวันนี้", value: pointsToday._sum.points ?? 0 },
    { label: "แต้มที่แจกทั้งหมด", value: pointsAllTime._sum.points ?? 0 },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ภาพรวมระบบ</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-gray-800">รายการตามสาขา</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รหัสสาขา</th>
              <th className="px-4 py-2">ชื่อสาขา</th>
              <th className="px-4 py-2">จำนวนธุรกรรม</th>
            </tr>
          </thead>
          <tbody>
            {byBranch.map((b) => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-mono">{b.code}</td>
                <td className="px-4 py-2">{b.name}</td>
                <td className="px-4 py-2">{b._count.transactions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
