import Link from "next/link";
import { prisma, computePeriodsForMonth } from "@lamunn/db-finance";
import { computePeriodReceivable, getPerBranchOutstanding } from "@/lib/creditTermCalc";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { getCreditTermOutstanding } from "@/lib/finance";
import GenerateCreditTermButton from "@/components/GenerateCreditTermButton";
import CreditTermStatusButton from "@/components/CreditTermStatusButton";
import AddManualCreditTermForm from "@/components/AddManualCreditTermForm";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CreditTermPage() {
  // ไม่กรอง isActive — สาขาที่ปิดไปแล้วอาจยังมีรอบค้างจ่ายที่ต้องปิดรอบ/ติดตามอยู่
  const branches = await prisma.branch.findMany({
    where: { type: "CREDIT_TERM" },
    orderBy: { sortOrder: "asc" },
    include: { creditTermConfig: true },
  });

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex0 = now.getUTCMonth();

  const currentPeriodCards = await Promise.all(
    branches
      .filter((b) => b.creditTermConfig)
      .flatMap((b) => {
        const periods = computePeriodsForMonth(b.creditTermConfig!, year, monthIndex0);
        return periods.map((p) => ({ branch: b, period: p }));
      })
      .map(async ({ branch, period }) => {
        const computed = await computePeriodReceivable(branch.id, period.periodStart, period.periodEnd);
        const existing = await prisma.creditTermPayment.findFirst({
          where: { branchId: branch.id, periodStart: period.periodStart, periodEnd: period.periodEnd },
        });
        return { branch, period, computed, existing };
      })
  );

  const [outstanding, allPayments, branchOptions, dueDateGroups, perBranchOutstanding] = await Promise.all([
    getCreditTermOutstanding(),
    prisma.creditTermPayment.findMany({ include: { branch: true }, orderBy: { dueDate: "desc" }, take: 100 }),
    prisma.branch.findMany({ where: { type: "CREDIT_TERM" }, select: { id: true, name: true } }),
    prisma.creditTermPayment.groupBy({
      by: ["dueDate"],
      where: { status: "PENDING" },
      _sum: { netAmount: true },
      _count: { _all: true },
      orderBy: { dueDate: "asc" },
    }),
    getPerBranchOutstanding(),
  ]);

  const overdueTotal = allPayments
    .filter((p) => p.status === "PENDING" && p.dueDate < now)
    .reduce((a, p) => a + p.netAmount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Credit Term — ตารางจ่ายเงินและยอดค้างรับจากห้าง</h1>
        <Link href="/credit-term/settings" className="text-sm text-brand-600 hover:underline">
          ⚙ ตั้งค่ารอบจ่ายเงินรายสาขา →
        </Link>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        ยอดค้างห้างรายสาขา — เงินของเราที่ยังติดอยู่กับห้างตอนนี้ (ไว้ไล่เช็คกับเงินเข้าบัญชีจริง)
      </h2>
      <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">ห้าง / สาขา</th>
              <th className="px-3 py-2 text-right">ยอดค้างปัจจุบัน (บาท)</th>
              <th className="px-3 py-2 text-right">จำนวนรอบที่ค้าง</th>
            </tr>
          </thead>
          <tbody>
            {perBranchOutstanding
              .filter((b) => b.totalOutstanding > 0)
              .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
              .map((b) => (
                <tr key={b.branchId} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-800">{b.branchName}</td>
                  <td className="px-3 py-2 text-right font-semibold text-brand-700">{formatBaht(b.totalOutstanding)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{b.pendingCycles}</td>
                </tr>
              ))}
            {perBranchOutstanding.every((b) => b.totalOutstanding <= 0) && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={3}>
                  ไม่มียอดค้างกับห้างใดเลยตอนนี้
                </td>
              </tr>
            )}
          </tbody>
          {perBranchOutstanding.some((b) => b.totalOutstanding > 0) && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2">รวมทั้งหมด</td>
                <td className="px-3 py-2 text-right">
                  {formatBaht(perBranchOutstanding.reduce((a, b) => a + b.totalOutstanding, 0))}
                </td>
                <td className="px-3 py-2 text-right">{perBranchOutstanding.reduce((a, b) => a + b.pendingCycles, 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">ยอดรอรับทั้งหมด</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{formatBaht(outstanding)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">เกินกำหนดแล้ว</p>
          <p className="mt-1 text-lg font-bold text-red-600">{formatBaht(overdueTotal)} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">จำนวนรอบที่รอรับ</p>
          <p className="mt-1 text-lg font-bold text-gray-800">
            {allPayments.filter((p) => p.status === "PENDING").length}
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">เงินจะเข้าวันไหนบ้าง (เฉพาะที่ยังไม่ชำระ)</h2>
      <div className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">วันครบกำหนด</th>
              <th className="px-3 py-2 text-right">ยอดรวมที่จะได้รับ</th>
              <th className="px-3 py-2 text-right">จำนวนรอบ</th>
            </tr>
          </thead>
          <tbody>
            {dueDateGroups.map((g) => (
              <tr key={g.dueDate.toISOString()} className={`border-t border-gray-100 ${g.dueDate < now ? "bg-red-50" : ""}`}>
                <td className="px-3 py-2 font-medium text-gray-800">
                  {formatThaiDate(g.dueDate)} {g.dueDate < now && <span className="text-red-600">(เกินกำหนด)</span>}
                </td>
                <td className="px-3 py-2 text-right font-semibold text-brand-700">{formatBaht(g._sum.netAmount)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{g._count._all}</td>
              </tr>
            ))}
            {dueDateGroups.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={3}>
                  ไม่มีรายการรอชำระ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">รอบเดือนนี้ — คำนวณสด (กดปิดรอบเมื่อพร้อม)</h2>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currentPeriodCards.map(({ branch, period, computed, existing }, i) => (
          <div key={`${branch.id}-${i}`} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
            <p className="text-xs text-gray-400">
              {period.label} ({formatThaiDate(period.periodStart)} – {formatThaiDate(period.periodEnd)})
            </p>
            <p className="mt-2 text-xs text-gray-500">
              ยอดขาย {formatBaht(computed.grossStorefront + computed.grossDelivery)} บาท → หัก GP{" "}
              {formatBaht(computed.gpDeductStorefront + computed.gpDeductDelivery + computed.vendorFeeDeduct)} บาท
            </p>
            <p className="mt-1 text-base font-bold text-brand-700">{formatBaht(computed.netAmount)} บาท</p>
            <p className="text-xs text-gray-400">ครบกำหนด {formatThaiDate(period.dueDate)}</p>
            <div className="mt-3 flex items-center gap-2">
              {existing ? (
                <CreditTermStatusButton id={existing.id} status={existing.status} />
              ) : (
                <span className="text-xs text-gray-400">ยังไม่ปิดรอบ</span>
              )}
              <GenerateCreditTermButton
                branchId={branch.id}
                periodStart={toISODate(period.periodStart)}
                periodEnd={toISODate(period.periodEnd)}
                dueDate={toISODate(period.dueDate)}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-gray-700">ประวัติรอบรับเงินทั้งหมด</h2>
      <AddManualCreditTermForm branches={branchOptions} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">สาขา / รายการ</th>
              <th className="px-3 py-2">ช่วงเวลา</th>
              <th className="px-3 py-2 text-right">ยอดรับสุทธิ</th>
              <th className="px-3 py-2">ครบกำหนด</th>
              <th className="px-3 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{p.branch?.name ?? p.label ?? "-"}</td>
                <td className="px-3 py-2 text-gray-500">
                  {p.periodStart && p.periodEnd
                    ? `${formatThaiDate(p.periodStart)} – ${formatThaiDate(p.periodEnd)}`
                    : p.label ?? "-"}
                </td>
                <td className="px-3 py-2 text-right font-medium">{formatBaht(p.netAmount)}</td>
                <td className="px-3 py-2 text-gray-500">{formatThaiDate(p.dueDate)}</td>
                <td className="px-3 py-2">
                  <CreditTermStatusButton id={p.id} status={p.status} />
                </td>
              </tr>
            ))}
            {allPayments.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                  ยังไม่มีรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
