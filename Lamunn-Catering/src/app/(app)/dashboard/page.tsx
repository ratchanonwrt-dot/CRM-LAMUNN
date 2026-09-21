import Link from "next/link";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import { formatBaht, formatThaiDate, paymentStatusLabel, pickupStatusLabel } from "@/lib/format";

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default async function DashboardPage() {
  await requirePageRole();

  const today = startOfToday();
  const in30Days = new Date(today);
  in30Days.setUTCDate(in30Days.getUTCDate() + 30);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const in3Days = new Date(today);
  in3Days.setUTCDate(in3Days.getUTCDate() + 3);

  const [upcomingBookings, paymentCounts, upcomingPickups, monthBookingsAgg, monthPickupsAgg] = await Promise.all([
    prisma.cateringBooking.findMany({
      where: { eventDate: { gte: today, lte: in30Days }, status: { not: "CANCELLED" } },
      include: { customer: true },
      orderBy: { eventDate: "asc" },
      take: 8,
    }),
    prisma.cateringBooking.groupBy({
      by: ["paymentStatus"],
      where: { status: { not: "CANCELLED" } },
      _count: { _all: true },
    }),
    prisma.pickupOrder.findMany({
      where: { pickupDate: { gte: today, lte: in3Days }, status: { in: ["PENDING", "READY"] } },
      include: { branch: true },
      orderBy: { pickupDate: "asc" },
      take: 8,
    }),
    prisma.cateringBooking.aggregate({
      where: { eventDate: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.pickupOrder.aggregate({
      where: { orderDate: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const paymentCountMap = Object.fromEntries(paymentCounts.map((p) => [p.paymentStatus, p._count._all]));

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ภาพรวม</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">การจองเดือนนี้</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{monthBookingsAgg._count._all} งาน</p>
          <p className="text-xs text-gray-400">{formatBaht(monthBookingsAgg._sum.totalAmount)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ออเดอร์นัดรับเดือนนี้</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{monthPickupsAgg._count._all} ออเดอร์</p>
          <p className="text-xs text-gray-400">{formatBaht(monthPickupsAgg._sum.amount)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ยังไม่ชำระ / มัดจำแล้ว</p>
          <p className="mt-1 text-lg font-bold text-amber-600">
            {paymentCountMap.UNPAID ?? 0} / {paymentCountMap.DEPOSIT_PAID ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ชำระครบแล้ว</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{paymentCountMap.FULLY_PAID ?? 0} งาน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">งานจัดเลี้ยงที่จะถึง (30 วันข้างหน้า)</h2>
          <div className="flex flex-col gap-2">
            {upcomingBookings.map((b) => (
              <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{b.customer.name}</p>
                  <p className="text-xs text-gray-400">{formatThaiDate(b.eventDate)}</p>
                </div>
                <span className="text-xs text-gray-500">{paymentStatusLabel[b.paymentStatus]}</span>
              </Link>
            ))}
            {upcomingBookings.length === 0 && <p className="text-sm text-gray-400">ไม่มีงานในช่วงนี้</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">ออเดอร์นัดรับใกล้ถึง (3 วันข้างหน้า)</h2>
          <div className="flex flex-col gap-2">
            {upcomingPickups.map((o) => (
              <Link key={o.id} href={`/pickup-orders/${o.id}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{o.customerName}</p>
                  <p className="text-xs text-gray-400">
                    {formatThaiDate(o.pickupDate)} {o.branch ? `· ${o.branch.name}` : ""}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{pickupStatusLabel[o.status]}</span>
              </Link>
            ))}
            {upcomingPickups.length === 0 && <p className="text-sm text-gray-400">ไม่มีออเดอร์ในช่วงนี้</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
