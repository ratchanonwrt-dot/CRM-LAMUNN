import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatBaht, customerSourceLabel } from "@/lib/format";

export default async function CustomersPage({ searchParams }: { searchParams: { source?: string } }) {
  await requirePageRole();
  const { source } = searchParams;

  const customers = await prisma.customer.findMany({
    where: source ? { source: source as never } : {},
    include: { bookings: { select: { totalAmount: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  const sourceCounts = customers.reduce<Record<string, number>>((acc, c) => {
    const key = c.source ?? "ไม่ระบุ";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ลูกค้า ({customers.length})</h1>
      <p className="mb-6 text-sm text-gray-500">สำหรับดูว่าลูกค้ามาจากช่องทางไหนบ้าง และใครเป็นลูกค้าประจำ</p>

      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(sourceCounts).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{customerSourceLabel[key] ?? key}</p>
            <p className="text-lg font-bold text-brand-700">{count}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อ</th>
              <th className="px-4 py-2">เบอร์โทร</th>
              <th className="px-4 py-2">มาจากไหน</th>
              <th className="px-4 py-2">จำนวนครั้งที่จอง</th>
              <th className="px-4 py-2">ยอดรวมสะสม</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const validBookings = c.bookings.filter((b) => b.status !== "CANCELLED");
              const total = validBookings.reduce((a, b) => a + b.totalAmount, 0);
              return (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-2 text-gray-500">{c.phone}</td>
                  <td className="px-4 py-2 text-gray-500">{c.source ? customerSourceLabel[c.source] ?? c.source : "-"}</td>
                  <td className="px-4 py-2 text-gray-700">{validBookings.length}</td>
                  <td className="px-4 py-2 text-gray-700">{formatBaht(total)} บาท</td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีข้อมูลลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
