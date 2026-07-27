import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatPercent } from "@/lib/format";
import { getCashOnHand, getCreditTermOutstanding } from "@/lib/finance";
import { computeRent } from "@/lib/rentCalc";

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ?? "text-gray-800"}`}>{value}</p>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วต้องยังเห็นยอดขายย้อนหลังของเดือนที่เคยเปิดอยู่
  const branches = await prisma.branch.findMany({
    orderBy: { sortOrder: "asc" },
    include: { rentConfig: true },
  });

  const salesAgg = await prisma.dailySales.groupBy({
    by: ["branchId"],
    where: { date: { gte: start, lte: end } },
    _sum: { cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true },
  });
  const salesByBranch = new Map(salesAgg.map((s) => [s.branchId, s._sum]));

  const companyAgg = await prisma.companyChannelDaily.aggregate({
    where: { date: { gte: start, lte: end } },
    _sum: { tiktok: true, fbLine: true, pickup: true, catering: true },
  });
  const ecomTotal =
    (companyAgg._sum.tiktok ?? 0) + (companyAgg._sum.fbLine ?? 0) + (companyAgg._sum.pickup ?? 0) + (companyAgg._sum.catering ?? 0);

  const rows = branches.map((b) => {
    const s = salesByBranch.get(b.id);
    const storefront = b.type === "CASH" ? (s?.cashPos ?? 0) + (s?.transfer ?? 0) : s?.cashTransferCombined ?? 0;
    const delivery = (s?.grab ?? 0) + (s?.lineman ?? 0);
    const total = storefront + delivery;

    const rent = b.rentConfig ? computeRent(b.rentConfig, storefront, delivery).rentAmount : 0;

    return { branch: b, storefront, delivery, total, rent };
  });

  const totalStorefront = rows.reduce((a, r) => a + r.storefront, 0);
  const totalDelivery = rows.reduce((a, r) => a + r.delivery, 0);
  const totalRent = rows.reduce((a, r) => a + r.rent, 0);
  const grandTotal = totalStorefront + totalDelivery + ecomTotal;

  const [cashOnHand, creditTermOutstanding] = await Promise.all([getCashOnHand(), getCreditTermOutstanding()]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ภาพรวมยอดขาย — 23 สาขา</h1>

      <MonthFilterBar basePath="/dashboard" year={year} month={month} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="ยอดขายรวมทั้งหมด" value={formatBaht(grandTotal)} accent="text-brand-700" />
        <StatCard label="หน้าร้าน (Storefront)" value={formatBaht(totalStorefront)} />
        <StatCard label="Delivery (Grab+Lineman)" value={formatBaht(totalDelivery)} />
        <StatCard label="E-Commerce" value={formatBaht(ecomTotal)} />
        <StatCard label="ค่าเช่ารวม (ประมาณการ)" value={formatBaht(totalRent)} />
        <StatCard label="Credit Term ค้างห้าง" value={formatBaht(creditTermOutstanding)} accent="text-amber-600" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard label="เงินสดสะสมในมือ (ครัวกลาง)" value={`${formatBaht(cashOnHand.balance)} บาท`} accent="text-violet-600" />
        <StatCard
          label="ยอดยกมาก่อนเริ่มระบบ"
          value={`${formatBaht(cashOnHand.openingBalance)} บาท`}
        />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold text-gray-700">ยอดขายรายสาขา</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">No.</th>
              <th className="px-3 py-2">สาขา</th>
              <th className="px-3 py-2">ประเภท</th>
              <th className="px-3 py-2 text-right">หน้าร้าน</th>
              <th className="px-3 py-2 text-right">Delivery</th>
              <th className="px-3 py-2 text-right">รวม</th>
              <th className="px-3 py-2 text-right">%หน้าร้าน</th>
              <th className="px-3 py-2 text-right">%Delivery</th>
              <th className="px-3 py-2 text-right">ค่าเช่า (ประมาณการ)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.branch.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {r.branch.name}
                  {!r.branch.isActive && <span className="ml-1.5 text-xs font-normal text-gray-400">(ปิดสาขาแล้ว)</span>}
                </td>
                <td className="px-3 py-2 text-gray-500">{r.branch.type === "CREDIT_TERM" ? "Credit Term" : "เงินสด"}</td>
                <td className="px-3 py-2 text-right">{formatBaht(r.storefront)}</td>
                <td className="px-3 py-2 text-right">{formatBaht(r.delivery)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatBaht(r.total)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.total ? formatPercent(r.storefront / r.total) : "-"}</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.total ? formatPercent(r.delivery / r.total) : "-"}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.rent)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
              <td className="px-3 py-2" colSpan={3}>
                รวมทั้งหมด (+ E-Commerce {formatBaht(ecomTotal)})
              </td>
              <td className="px-3 py-2 text-right">{formatBaht(totalStorefront)}</td>
              <td className="px-3 py-2 text-right">{formatBaht(totalDelivery)}</td>
              <td className="px-3 py-2 text-right">{formatBaht(grandTotal)}</td>
              <td className="px-3 py-2" colSpan={2}></td>
              <td className="px-3 py-2 text-right">{formatBaht(totalRent)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
