import { prisma } from "@lamunn/db-finance";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange } from "@/lib/dates";
import { formatBaht, formatThaiDate } from "@/lib/format";

const EPSILON = 0.01;

export default async function ReconciliationPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const rows = await prisma.dailySales.findMany({
    where: { date: { gte: start, lte: end }, posCheckTotal: { not: null } },
    include: { branch: { select: { name: true, type: true } } },
    orderBy: { date: "asc" },
  });

  const checked = rows.map((r) => {
    const storefront = r.branch.type === "CASH" ? (r.cashPos ?? 0) + (r.transfer ?? 0) : r.cashTransferCombined ?? 0;
    const computedTotal = storefront + r.grab + r.lineman;
    const posTotal = r.posCheckTotal ?? 0;
    const diff = posTotal - computedTotal;
    return { ...r, computedTotal, posTotal, diff };
  });

  const mismatches = checked.filter((r) => Math.abs(r.diff) > EPSILON).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  const matched = checked.length - mismatches.length;

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">เช็คยอด POS — เทียบยอดที่กรอกกับยอดรวม POS</h1>
      <p className="mb-6 text-sm text-gray-500">
        เทียบยอดที่พนักงานกรอกแยกจาก 3 แอพ (POS/Lineman/Grab) กับยอดรวม POS ที่กรอกไว้ในช่อง &quot;ยอดรวม POS (เช็คยอด)&quot; ของแต่ละวัน —
        ถ้ามีผลต่างแปลว่ากรอกข้อมูลผิดหรือยอดไม่ตรงกัน
      </p>

      <MonthFilterBar basePath="/reconciliation" year={year} month={month} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">วันที่มีข้อมูลเช็คยอด</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{checked.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ตรงกัน</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{matched}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ไม่ตรง (ต้องตรวจสอบ)</p>
          <p className="mt-1 text-lg font-bold text-red-600">{mismatches.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">วันที่</th>
              <th className="px-3 py-2">สาขา</th>
              <th className="px-3 py-2 text-right">ยอดที่กรอก (POS+Grab+Lineman)</th>
              <th className="px-3 py-2 text-right">ยอดรวม POS</th>
              <th className="px-3 py-2 text-right">ผลต่าง</th>
            </tr>
          </thead>
          <tbody>
            {mismatches.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 bg-red-50/50">
                <td className="px-3 py-2">{formatThaiDate(r.date)}</td>
                <td className="px-3 py-2 font-medium text-gray-800">{r.branch.name}</td>
                <td className="px-3 py-2 text-right">{formatBaht(r.computedTotal)}</td>
                <td className="px-3 py-2 text-right">{formatBaht(r.posTotal)}</td>
                <td className="px-3 py-2 text-right font-semibold text-red-600">{formatBaht(r.diff)}</td>
              </tr>
            ))}
            {mismatches.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                  {checked.length === 0 ? "ยังไม่มีการกรอกยอดรวม POS ในเดือนนี้" : "ยอดตรงกันทั้งหมด ✓"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
