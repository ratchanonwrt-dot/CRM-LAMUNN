import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatPercent, thaiMonthLabel } from "@/lib/format";
import { getDailyTotals, seriesForRange, sumMap } from "@/lib/reportsCalc";
import DonutChart, { CHART_COLORS } from "@/components/charts/DonutChart";
import LineChart from "@/components/charts/LineChart";

function pct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">-</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`}>
      {up ? "▲" : "▼"} {formatPercent(Math.abs(value))}
    </span>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);
  const clampedEnd = end > now ? now : end;

  const lastMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const { start: lastStart, end: lastEnd } = monthRange(lastMonthDate.getUTCFullYear(), lastMonthDate.getUTCMonth());

  // --- ยอดขายรวมรายวัน (ทุกช่องทาง) เดือนนี้ + เดือนก่อน สำหรับกราฟเส้นเทียบ ---
  const [thisMonthDaily, lastMonthDaily] = await Promise.all([
    getDailyTotals(start, clampedEnd),
    getDailyTotals(lastStart, lastEnd),
  ]);
  const thisMonthTotal = sumMap(thisMonthDaily);
  const lastMonthTotal = sumMap(lastMonthDaily);
  const daysSoFar = Math.max(1, Math.round((clampedEnd.getTime() - start.getTime()) / 86400000) + 1);
  const dailyAverage = thisMonthTotal / daysSoFar;

  // --- สัปดาห์นี้ vs สัปดาห์ที่แล้ว (rolling 7 วันจากวันนี้) ---
  const weekEnd = now;
  const weekStart = new Date(now.getTime() - 6 * 86400000);
  const prevWeekEnd = new Date(now.getTime() - 7 * 86400000);
  const prevWeekStart = new Date(now.getTime() - 13 * 86400000);
  const [thisWeekDaily, prevWeekDaily] = await Promise.all([
    getDailyTotals(weekStart, weekEnd),
    getDailyTotals(prevWeekStart, prevWeekEnd),
  ]);
  const thisWeekTotal = sumMap(thisWeekDaily);
  const prevWeekTotal = sumMap(prevWeekDaily);

  // --- Ranking รายสาขา: เดือนนี้ vs เดือนก่อน ---
  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วต้องยังเห็นในอันดับของเดือนที่เคยเปิดอยู่
  const branches = await prisma.branch.findMany({ select: { id: true, name: true, type: true, isActive: true } });
  const [thisMonthBranchAgg, lastMonthBranchAgg] = await Promise.all([
    prisma.dailySales.groupBy({
      by: ["branchId"],
      where: { date: { gte: start, lte: clampedEnd } },
      _sum: { cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true },
    }),
    prisma.dailySales.groupBy({
      by: ["branchId"],
      where: { date: { gte: lastStart, lte: lastEnd } },
      _sum: { cashPos: true, transfer: true, cashTransferCombined: true, grab: true, lineman: true },
    }),
  ]);
  const totalFor = (type: "CASH" | "CREDIT_TERM", s?: { cashPos: number | null; transfer: number | null; cashTransferCombined: number | null; grab: number | null; lineman: number | null }) => {
    if (!s) return 0;
    const storefront = type === "CASH" ? (s.cashPos ?? 0) + (s.transfer ?? 0) : s.cashTransferCombined ?? 0;
    return storefront + (s.grab ?? 0) + (s.lineman ?? 0);
  };
  const thisMap = new Map(thisMonthBranchAgg.map((r) => [r.branchId, r._sum]));
  const lastMap = new Map(lastMonthBranchAgg.map((r) => [r.branchId, r._sum]));
  const ranking = branches
    .map((b) => {
      const thisTotal = totalFor(b.type, thisMap.get(b.id));
      const lastTotal = totalFor(b.type, lastMap.get(b.id));
      return { branch: b, thisTotal, lastTotal, change: pct(thisTotal, lastTotal) };
    })
    .sort((a, b) => b.thisTotal - a.thisTotal);

  // --- แยกช่องทาง (เดือนนี้) ---
  const [storefrontCashAgg, storefrontCtAgg, deliveryAgg, companyAgg] = await Promise.all([
    prisma.dailySales.aggregate({
      where: { date: { gte: start, lte: clampedEnd }, branch: { type: "CASH" } },
      _sum: { cashPos: true, transfer: true },
    }),
    prisma.dailySales.aggregate({
      where: { date: { gte: start, lte: clampedEnd }, branch: { type: "CREDIT_TERM" } },
      _sum: { cashTransferCombined: true },
    }),
    prisma.dailySales.aggregate({
      where: { date: { gte: start, lte: clampedEnd } },
      _sum: { grab: true, lineman: true },
    }),
    prisma.companyChannelDaily.aggregate({
      where: { date: { gte: start, lte: clampedEnd } },
      _sum: { tiktok: true, fbLine: true, pickup: true, catering: true },
    }),
  ]);
  const storefrontTotal = (storefrontCashAgg._sum.cashPos ?? 0) + (storefrontCashAgg._sum.transfer ?? 0) + (storefrontCtAgg._sum.cashTransferCombined ?? 0);
  const grabTotal = deliveryAgg._sum.grab ?? 0;
  const linemanTotal = deliveryAgg._sum.lineman ?? 0;
  const ecomTotal = (companyAgg._sum.tiktok ?? 0) + (companyAgg._sum.fbLine ?? 0) + (companyAgg._sum.pickup ?? 0) + (companyAgg._sum.catering ?? 0);

  const channelSlices = [
    { label: "หน้าร้าน (Storefront)", value: storefrontTotal, color: CHART_COLORS.blue },
    { label: "Grab", value: grabTotal, color: CHART_COLORS.green },
    { label: "Lineman", value: linemanTotal, color: CHART_COLORS.magenta },
    { label: "E-Commerce", value: ecomTotal, color: CHART_COLORS.yellow },
  ];
  const ecomSlices = [
    { label: "TikTok", value: companyAgg._sum.tiktok ?? 0, color: CHART_COLORS.aqua },
    { label: "FB / Line", value: companyAgg._sum.fbLine ?? 0, color: CHART_COLORS.orange },
    { label: "รับหน้าร้าน", value: companyAgg._sum.pickup ?? 0, color: CHART_COLORS.violet },
    { label: "Catering", value: companyAgg._sum.catering ?? 0, color: CHART_COLORS.red },
  ];

  const trendSeries = [
    { label: thaiMonthLabel(year, month - 1), color: CHART_COLORS.blue, points: seriesForRange(thisMonthDaily, start, clampedEnd) },
    { label: thaiMonthLabel(lastMonthDate.getUTCFullYear(), lastMonthDate.getUTCMonth()), color: "#c3c2b7", points: seriesForRange(lastMonthDaily, lastStart, lastEnd) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ภาพรวมและวิเคราะห์ยอดขาย</h1>

      <MonthFilterBar basePath="/reports" year={year} month={month} />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ยอดขายรวมเดือนนี้</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{formatBaht(thisMonthTotal)}</p>
          <ChangeBadge value={pct(thisMonthTotal, lastMonthTotal)} />
          <span className="ml-1 text-xs text-gray-400">เทียบเดือนก่อน</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เฉลี่ยต่อวัน (เดือนนี้)</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(dailyAverage)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">7 วันล่าสุด</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(thisWeekTotal)}</p>
          <ChangeBadge value={pct(thisWeekTotal, prevWeekTotal)} />
          <span className="ml-1 text-xs text-gray-400">เทียบ 7 วันก่อนหน้า</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เดือนก่อน (เทียบ)</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(lastMonthTotal)}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">สัดส่วนช่องทางการขาย (เดือนนี้)</h2>
          <DonutChart data={channelSlices} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">สัดส่วน E-Commerce ย่อย (เดือนนี้)</h2>
          <DonutChart data={ecomSlices} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">แนวโน้มยอดขายรายวัน — เทียบเดือนก่อน</h2>
        <LineChart series={trendSeries} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">อันดับสาขา — เดือนนี้ vs เดือนก่อน</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">อันดับ</th>
              <th className="px-3 py-2">สาขา</th>
              <th className="px-3 py-2 text-right">เดือนนี้</th>
              <th className="px-3 py-2 text-right">เดือนก่อน</th>
              <th className="px-3 py-2 text-right">เปลี่ยนแปลง</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.branch.id} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {r.branch.name}
                  {!r.branch.isActive && <span className="ml-1.5 text-xs font-normal text-gray-400">(ปิดสาขาแล้ว)</span>}
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatBaht(r.thisTotal)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{formatBaht(r.lastTotal)}</td>
                <td className="px-3 py-2 text-right">
                  <ChangeBadge value={r.change} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
