import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatBaht, thaiMonthLabel, customerSourceLabel } from "@/lib/format";

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

export default async function ReportsPage() {
  await requirePageRole();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
  twelveMonthsAgo.setUTCDate(1);

  const [bookings, pickupOrders, customers] = await Promise.all([
    prisma.cateringBooking.findMany({
      where: { eventDate: { gte: twelveMonthsAgo }, status: { not: "CANCELLED" } },
      include: { staffAssignments: { include: { staff: { select: { name: true } } } } },
    }),
    prisma.pickupOrder.findMany({
      where: { orderDate: { gte: twelveMonthsAgo }, status: { not: "CANCELLED" } },
    }),
    prisma.customer.findMany({
      include: { bookings: { select: { totalAmount: true, status: true } } },
    }),
  ]);

  // รายได้รายเดือน (การจอง + นัดรับ)
  const monthly = new Map<string, { bookingRevenue: number; pickupRevenue: number; date: Date }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    monthly.set(monthKey(d), { bookingRevenue: 0, pickupRevenue: 0, date: d });
  }
  for (const b of bookings) {
    const key = monthKey(b.eventDate);
    const entry = monthly.get(key);
    if (entry) entry.bookingRevenue += b.totalAmount;
  }
  for (const o of pickupOrders) {
    const key = monthKey(o.orderDate);
    const entry = monthly.get(key);
    if (entry) entry.pickupRevenue += o.amount;
  }
  const monthlyRows = Array.from(monthly.values());

  // แพคเกจยอดนิยม
  const packageStats = new Map<string, { count: number; revenue: number }>();
  for (const b of bookings) {
    const key = b.packageNameSnapshot ?? "ไม่ใช้แพคเกจสำเร็จรูป";
    const entry = packageStats.get(key) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += b.totalAmount;
    packageStats.set(key, entry);
  }
  const packageRows = Array.from(packageStats.entries()).sort((a, b) => b[1].count - a[1].count);

  // ลูกค้ามาจากไหน
  const sourceStats = new Map<string, { count: number; revenue: number }>();
  for (const c of customers) {
    const key = c.source ?? "ไม่ระบุ";
    const validBookings = c.bookings.filter((b) => b.status !== "CANCELLED");
    const entry = sourceStats.get(key) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += validBookings.reduce((a, b) => a + b.totalAmount, 0);
    sourceStats.set(key, entry);
  }
  const sourceRows = Array.from(sourceStats.entries()).sort((a, b) => b[1].count - a[1].count);

  // ภาระงานพนักงาน
  const staffStats = new Map<string, number>();
  for (const b of bookings) {
    for (const a of b.staffAssignments) {
      staffStats.set(a.staff.name, (staffStats.get(a.staff.name) ?? 0) + 1);
    }
  }
  const staffRows = Array.from(staffStats.entries()).sort((a, b) => b[1] - a[1]);

  const totalRevenue = monthlyRows.reduce((a, r) => a + r.bookingRevenue + r.pickupRevenue, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">รายงาน/วิเคราะห์</h1>
        <p className="text-sm text-gray-500">ย้อนหลัง 12 เดือน — รวมยอด {formatBaht(totalRevenue)} บาท</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">รายได้รายเดือน (จัดเลี้ยง + นัดรับหน้าร้าน)</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="px-3 py-1.5">เดือน</th>
                <th className="px-3 py-1.5">จัดเลี้ยง</th>
                <th className="px-3 py-1.5">นัดรับหน้าร้าน</th>
                <th className="px-3 py-1.5">รวม</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((r) => (
                <tr key={monthKey(r.date)} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-700">{thaiMonthLabel(r.date.getUTCFullYear(), r.date.getUTCMonth())}</td>
                  <td className="px-3 py-1.5 text-gray-600">{formatBaht(r.bookingRevenue)}</td>
                  <td className="px-3 py-1.5 text-gray-600">{formatBaht(r.pickupRevenue)}</td>
                  <td className="px-3 py-1.5 font-medium text-gray-800">{formatBaht(r.bookingRevenue + r.pickupRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">แพคเกจยอดนิยม</h2>
          <div className="flex flex-col gap-2">
            {packageRows.map(([name, s]) => (
              <div key={name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-700">{name}</span>
                <span className="text-gray-500">{s.count} งาน · {formatBaht(s.revenue)} บาท</span>
              </div>
            ))}
            {packageRows.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">ลูกค้ามาจากไหน</h2>
          <div className="flex flex-col gap-2">
            {sourceRows.map(([key, s]) => (
              <div key={key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-700">{customerSourceLabel[key] ?? key}</span>
                <span className="text-gray-500">{s.count} คน · {formatBaht(s.revenue)} บาท</span>
              </div>
            ))}
            {sourceRows.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">ภาระงานพนักงาน (จำนวนงานที่ได้รับมอบหมาย)</h2>
          <div className="flex flex-wrap gap-2">
            {staffRows.map(([name, count]) => (
              <div key={name} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-700">{name}</span> <span className="text-gray-500">— {count} งาน</span>
              </div>
            ))}
            {staffRows.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
