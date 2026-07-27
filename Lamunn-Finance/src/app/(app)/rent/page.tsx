import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatPercent } from "@/lib/format";
import { computeRent } from "@/lib/rentCalc";

export default async function RentPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วต้องยังเห็นค่าเช่าของเดือนที่เคยเปิดอยู่
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

  const rows = branches
    .filter((b) => b.rentConfig)
    .map((b) => {
      const s = salesByBranch.get(b.id);
      const storefront = b.type === "CASH" ? (s?.cashPos ?? 0) + (s?.transfer ?? 0) : s?.cashTransferCombined ?? 0;
      const delivery = (s?.grab ?? 0) + (s?.lineman ?? 0);
      const result = computeRent(b.rentConfig!, storefront, delivery);
      return { branch: b, storefront, delivery, ...result };
    });

  const totalRent = rows.reduce((a, r) => a + r.rentAmount, 0);
  const belowMinimumCount = rows.filter((r) => r.minimumApplied).length;

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ค่าเช่า — ยอดขายเทียบ GP% / Minimum Guarantee</h1>

      <MonthFilterBar basePath="/rent" year={year} month={month} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ค่าเช่ารวมเดือนนี้ (ประมาณการ)</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{formatBaht(totalRent)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">สาขาที่ยอดขายยังไม่ถึง Minimum</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{belowMinimumCount} สาขา</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">สาขา</th>
              <th className="px-3 py-2 text-right">ยอดขายรวม</th>
              <th className="px-3 py-2 text-right">ค่าเช่าจาก GP%</th>
              <th className="px-3 py-2 text-right">Minimum</th>
              <th className="px-3 py-2 text-right">ค่าเช่าที่ต้องจ่ายจริง</th>
              <th className="px-3 py-2 text-right">GP% จริงที่เกิดขึ้น</th>
              <th className="px-3 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.branch.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">
                  {r.branch.name}
                  {!r.branch.isActive && <span className="ml-1.5 text-xs font-normal text-gray-400">(ปิดสาขาแล้ว)</span>}
                </td>
                <td className="px-3 py-2 text-right">{formatBaht(r.storefront + r.delivery)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.gpAmount)}</td>
                <td className="px-3 py-2 text-right text-gray-500">
                  {r.branch.rentConfig?.minAmount ? formatBaht(r.branch.rentConfig.minAmount) : "-"}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatBaht(r.rentAmount)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatPercent(r.effectiveGpPercent)}</td>
                <td className="px-3 py-2">
                  {r.branch.rentConfig?.rentType === "FIX_RATE" ? (
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500">ค่าเช่าคงที่</span>
                  ) : r.minimumApplied ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="w-fit rounded-lg bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        ยังไม่ถึง Minimum — จ่ายเพิ่มเอง
                      </span>
                      <span className="text-xs text-gray-400">
                        ต้องขายหน้าร้านเพิ่มอีก {formatBaht(r.salesGapToMinimum)} บาท ถึงจะถึง Minimum ด้วย GP ล้วน ๆ
                      </span>
                    </div>
                  ) : r.branch.rentConfig?.minAmount ? (
                    <span className="w-fit rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      ถึง Minimum แล้ว
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">ไม่มี Minimum</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
