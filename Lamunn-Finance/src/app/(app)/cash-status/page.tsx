import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { getCashOnHand } from "@/lib/finance";
import AddCashAdjustmentForm from "@/components/AddCashAdjustmentForm";
import DeleteCashAdjustmentButton from "@/components/DeleteCashAdjustmentButton";

export default async function CashStatusPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const { balance, openingBalance, openingDate } = await getCashOnHand();

  const cashBranches = await prisma.branch.findMany({ where: { type: "CASH" }, select: { id: true } });
  const cashBranchIds = cashBranches.map((b) => b.id);

  const clampedEnd = end > now ? now : end;

  const [prefixSalesAgg, prefixAdjAgg, adjustments] = await Promise.all([
    prisma.dailySales.aggregate({
      where: { branchId: { in: cashBranchIds }, date: { gt: openingDate, lt: start } },
      _sum: { cashCounted: true },
    }),
    prisma.cashAdjustment.aggregate({
      where: { date: { gt: openingDate, lt: start } },
      _sum: { amount: true },
    }),
    prisma.cashAdjustment.findMany({ orderBy: { date: "desc" }, take: 30 }),
  ]);
  let running = openingBalance + (prefixSalesAgg._sum.cashCounted ?? 0) + (prefixAdjAgg._sum.amount ?? 0);

  const [daily, monthAdjustments] = await Promise.all([
    prisma.dailySales.groupBy({
      by: ["date"],
      where: { branchId: { in: cashBranchIds }, date: { gte: start, lte: clampedEnd } },
      _sum: { cashCounted: true },
    }),
    prisma.cashAdjustment.findMany({ where: { date: { gte: start, lte: clampedEnd } } }),
  ]);
  const dailyMap = new Map(daily.map((d) => [d.date.toISOString().slice(0, 10), d._sum.cashCounted ?? 0]));
  const adjMap = new Map<string, { total: number; labels: string[] }>();
  for (const a of monthAdjustments) {
    const key = a.date.toISOString().slice(0, 10);
    const existing = adjMap.get(key) ?? { total: 0, labels: [] };
    existing.total += a.amount;
    existing.labels.push(a.label);
    adjMap.set(key, existing);
  }

  const rows: { date: Date; today: number; adjustment: number; adjustmentLabels: string[]; running: number }[] = [];
  for (let d = new Date(start); d <= clampedEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const today = dailyMap.get(key) ?? 0;
    const adj = adjMap.get(key);
    running += today + (adj?.total ?? 0);
    rows.push({ date: new Date(d), today, adjustment: adj?.total ?? 0, adjustmentLabels: adj?.labels ?? [], running });
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">สถานะเงินสด — เงินสดจริงที่ส่งกลับครัวกลาง</h1>
      <p className="mb-6 text-sm text-gray-500">
        นับเฉพาะ &quot;เงินสดนับ&quot; ของสาขาที่ไม่ใช่ Credit Term — ไม่รวมเงินโอน/Grab/Lineman เพราะเข้าบัญชีธนาคารโดยตรง
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เงินสดสะสมในมือตอนนี้ (real-time)</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{formatBaht(balance)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">
            ยอดยกมาก่อน {formatThaiDate(new Date(openingDate.getTime() + 86400000))}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatBaht(openingBalance)} บาท</p>
        </div>
      </div>

      <AddCashAdjustmentForm />

      <MonthFilterBar basePath="/cash-status" year={year} month={month} />

      <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2 text-right">เงินสดนับวันนี้</th>
              <th className="px-4 py-2 text-right">ปรับปรุง</th>
              <th className="px-4 py-2 text-right">สะสม (คงเหลือในระบบ)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date.toISOString()} className="border-t border-gray-100">
                <td className="px-4 py-2">{formatThaiDate(r.date)}</td>
                <td className="px-4 py-2 text-right">{formatBaht(r.today)}</td>
                <td className="px-4 py-2 text-right" title={r.adjustmentLabels.join(", ")}>
                  {r.adjustment !== 0 ? (
                    <span className={r.adjustment < 0 ? "text-red-600" : "text-emerald-600"}>{formatBaht(r.adjustment)}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={`px-4 py-2 text-right font-medium ${r.running < 0 ? "text-red-600" : "text-gray-800"}`}>
                  {formatBaht(r.running)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={4}>
                  ยังไม่มีข้อมูลในเดือนนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">ประวัติการปรับปรุงยอดเงินสด (ปันผล/แก้ไข)</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2 text-right">จำนวนเงิน</th>
              <th className="px-4 py-2">หมายเหตุ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{formatThaiDate(a.date)}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{a.label}</td>
                <td className={`px-4 py-2 text-right font-medium ${a.amount < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatBaht(a.amount)}
                </td>
                <td className="px-4 py-2 text-gray-500">{a.note ?? "-"}</td>
                <td className="px-4 py-2">
                  <DeleteCashAdjustmentButton id={a.id} />
                </td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={5}>
                  ยังไม่มีรายการปรับปรุง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
