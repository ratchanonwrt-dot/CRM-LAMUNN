import { Suspense } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import { formatBaht, formatThaiDate, paymentStatusLabel, pickupStatusLabel, thaiMonthLabel } from "@/lib/format";

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

function CateringSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-gray-200 bg-white" />
        <div className="h-64 rounded-xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}

// หัวข้อขึ้นทันที ไม่ต้องรอ query — เดิมหน้านี้ไม่มี Suspense เลย จอจึงว่างเปล่าจนกว่าจะโหลดครบทุกอย่าง
export default async function CateringDashboardPage() {
  await requireSectionPage("CATERING");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">Catering Overall</h1>
      <Suspense fallback={<CateringSkeleton />}>
        <CateringData />
      </Suspense>
    </div>
  );
}

async function CateringData() {
  const today = startOfToday();
  const in30Days = new Date(today);
  in30Days.setUTCDate(in30Days.getUTCDate() + 30);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const in3Days = new Date(today);
  in3Days.setUTCDate(in3Days.getUTCDate() + 3);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
  twelveMonthsAgo.setUTCDate(1);

  // เดิมยิง 7 คิวรีแบ่งเป็น 2 ชั้น ตอนนี้เหลือ 5 คิวรีชั้นเดียว —
  // ยอดรวม "เดือนนี้" ของทั้งงานจัดเลี้ยงและออเดอร์นัดรับ ถูกคำนวณจากชุดข้อมูล 12 เดือนย้อนหลัง
  // ที่ดึงมาอยู่แล้วแทนการยิง aggregate แยก (ช่วงเดือนนี้เป็นส่วนย่อยของ 12 เดือนย้อนหลังเสมอ)
  const [upcomingBookings, paymentCounts, upcomingPickups, yearBookings, yearPickupOrders] = await Promise.all([
    prisma.cateringBooking.findMany({
      where: { eventDate: { gte: today, lte: in30Days }, status: { not: "CANCELLED" } },
      include: { customer: { select: { name: true } }, staffAssignments: { include: { staff: { select: { name: true } } } } },
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
    prisma.cateringBooking.findMany({
      where: { eventDate: { gte: twelveMonthsAgo }, status: { not: "CANCELLED" } },
      select: { eventDate: true, totalAmount: true },
    }),
    prisma.pickupOrder.findMany({
      where: { orderDate: { gte: twelveMonthsAgo }, status: { not: "CANCELLED" } },
      select: { orderDate: true, amount: true },
    }),
  ]);

  // นับ/รวมยอดเดือนนี้จากข้อมูลที่ดึงมาแล้ว — รูปร่างเหมือนผลลัพธ์ของ prisma.aggregate() เดิม
  const monthBookings = yearBookings.filter((b) => b.eventDate >= monthStart);
  const monthBookingsAgg = {
    _count: { _all: monthBookings.length },
    _sum: { totalAmount: monthBookings.reduce((a, b) => a + b.totalAmount, 0) },
  };
  const monthPickups = yearPickupOrders.filter((o) => o.orderDate >= monthStart);
  const monthPickupsAgg = {
    _count: { _all: monthPickups.length },
    _sum: { amount: monthPickups.reduce((a, o) => a + o.amount, 0) },
  };

  const paymentCountMap = Object.fromEntries(paymentCounts.map((p) => [p.paymentStatus, p._count._all]));

  // รายได้รายเดือนย้อนหลัง 12 เดือน (จัดเลี้ยง + นัดรับหน้าร้าน) — ยุบมาจากหน้า Catering รายงานเดิม
  const monthlyRevenue = new Map<string, { bookingRevenue: number; pickupRevenue: number; date: Date }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo);
    d.setUTCMonth(d.getUTCMonth() + i);
    monthlyRevenue.set(monthKey(d), { bookingRevenue: 0, pickupRevenue: 0, date: d });
  }
  for (const b of yearBookings) {
    const entry = monthlyRevenue.get(monthKey(b.eventDate));
    if (entry) entry.bookingRevenue += b.totalAmount;
  }
  for (const o of yearPickupOrders) {
    const entry = monthlyRevenue.get(monthKey(o.orderDate));
    if (entry) entry.pickupRevenue += o.amount;
  }
  const monthlyRevenueRows = Array.from(monthlyRevenue.values());
  const yearTotalRevenue = monthlyRevenueRows.reduce((a, r) => a + r.bookingRevenue + r.pickupRevenue, 0);

  return (
    <>
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
              <Link key={b.id} href={`/catering/bookings/${b.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{b.customer.name}</p>
                  <p className="text-xs text-gray-400">
                    {formatThaiDate(b.eventDate)}
                    {b.eventEndDate && b.eventEndDate.getTime() > b.eventDate.getTime() ? ` – ${formatThaiDate(b.eventEndDate)}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {b.guestCount != null ? `${b.guestCount} เสิร์ฟ` : "ไม่ระบุจำนวนเสิร์ฟ"}
                    {" · "}
                    {b.needsBooth ? "มีบูธ" : "ไม่มีบูธ"}
                    {" · "}
                    {b.location || "ไม่ระบุสถานที่"}
                  </p>
                  <p className="mt-0.5 text-xs">
                    {b.staffAssignments.length > 0 ? (
                      <span className="text-brand-600">
                        {b.staffAssignments.length} คน: {b.staffAssignments.map((a) => a.staffName ?? a.staff?.name).join(", ")}
                      </span>
                    ) : (
                      <span className="text-red-500">ยังไม่ได้จัดคน</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-gray-500">{paymentStatusLabel[b.paymentStatus]}</span>
              </Link>
            ))}
            {upcomingBookings.length === 0 && <p className="text-sm text-gray-400">ไม่มีงานในช่วงนี้</p>}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">ออเดอร์นัดรับใกล้ถึง (3 วันข้างหน้า)</h2>
          <div className="flex flex-col gap-2">
            {upcomingPickups.map((o) => (
              <Link key={o.id} href={`/catering/pickup-orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{o.customerName}</p>
                  <p className="text-xs text-gray-400">
                    {formatThaiDate(o.pickupDate)}
                    {o.pickupTime ? ` · ${o.pickupTime} น.` : ""}
                    {o.branch ? ` · ${o.branch.name}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={
                      o.paymentStatus === "FULLY_PAID"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : o.paymentStatus === "DEPOSIT_PAID"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                    }
                  >
                    {paymentStatusLabel[o.paymentStatus]}
                  </span>
                  <span className="text-xs text-gray-400">{pickupStatusLabel[o.status]}</span>
                </div>
              </Link>
            ))}
            {upcomingPickups.length === 0 && <p className="text-sm text-gray-400">ไม่มีออเดอร์ในช่วงนี้</p>}
          </div>
        </div>
      </div>

      <details className="group mt-6 rounded-xl border border-gray-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 [&::-webkit-details-marker]:hidden">
          <span>
            รายได้รายเดือน (จัดเลี้ยง + นัดรับหน้าร้าน) — ย้อนหลัง 12 เดือน{" "}
            <span className="font-normal text-gray-400">รวม {formatBaht(yearTotalRevenue)} บาท</span>
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="overflow-x-auto border-t border-gray-100 p-4">
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
              {monthlyRevenueRows.map((r) => (
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
      </details>
    </>
  );
}
