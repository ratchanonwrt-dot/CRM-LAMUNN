import { Suspense } from "react";
import { requireSectionPage } from "@/lib/permissions";
import MonthFilterBar from "@/components/MonthFilterBar";
import { monthRange, parseDateOnly } from "@/lib/dates";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { loadCashRaw, computeCashBalance } from "@/lib/finance";
import { getAllSettings } from "@/lib/settings";
import AddCashAdjustmentForm from "@/components/AddCashAdjustmentForm";
import DeleteCashAdjustmentButton from "@/components/DeleteCashAdjustmentButton";

function CashStatusSkeleton() {
  return (
    <div className="mt-6 animate-pulse">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-16 rounded-xl border border-gray-200 bg-white" />
        <div className="h-16 rounded-xl border border-gray-200 bg-white" />
      </div>
      <div className="mt-6 h-64 rounded-xl border border-gray-200 bg-white" />
    </div>
  );
}

// ฟอร์มเพิ่มรายการปรับปรุงและตัวกรองเดือนไม่ต้องรอยอดเงินสดสะสม (ต้องคำนวณจากยอดขายสะสมทั้งหมดตั้งแต่วันยกมา
// ซึ่งหนักสุดของหน้านี้) ให้ shell ขึ้นก่อนได้เลย
export default async function CashStatusPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("CASH_STATUS");
  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">สถานะเงินสด — เงินสดจริงที่ส่งกลับครัวกลาง</h1>
      <p className="mb-6 text-sm text-gray-500">
        นับเฉพาะ &quot;เงินสดนับ&quot; ของสาขาที่ไม่ใช่ Credit Term — ไม่รวมเงินโอน/Grab/Lineman เพราะเข้าบัญชีธนาคารโดยตรง
      </p>

      <AddCashAdjustmentForm />

      <MonthFilterBar basePath="/cash-status" year={year} month={month} />

      <Suspense fallback={<CashStatusSkeleton />}>
        <CashStatusData year={year} month={month} />
      </Suspense>
    </div>
  );
}

async function CashStatusData({ year, month }: { year: number; month: number }) {
  const now = new Date();
  const { start, end } = monthRange(year, month - 1);

  const clampedEnd = end > now ? now : end;

  // ดึงข้อมูลเงินสดทั้งหมดครั้งเดียว (2 คิวรี) แล้วตัดช่วง/รวมยอดในหน่วยความจำ
  // เดิมหน้านี้ยิง 32 SQL statement เพราะแยก aggregate ทีละช่วงวันที่ — ตัวเลขที่ได้เท่ากันทุกช่อง
  // (พิสูจน์แล้วด้วย scripts/verify-refactor.ts เทียบย้อนหลัง 3 เดือน)
  const [settings, raw] = await Promise.all([getAllSettings(), loadCashRaw()]);
  const openingBalance = Number(settings.cashOpeningBalance);
  const openingDate = parseDateOnly(settings.cashOpeningDate);
  const balance = computeCashBalance(openingBalance, openingDate, raw);

  let prefixSales = 0;
  const dailyMap = new Map<string, number>();
  for (const d of raw.dailyByDate) {
    const value = d._sum.cashCounted ?? 0;
    if (d.date > openingDate && d.date < start) prefixSales += value;
    if (d.date >= start && d.date <= clampedEnd) dailyMap.set(d.date.toISOString().slice(0, 10), value);
  }

  let prefixAdj = 0;
  const monthAdjustments: typeof raw.adjustments = [];
  for (const a of raw.adjustments) {
    if (a.date > openingDate && a.date < start) prefixAdj += a.amount;
    if (a.date >= start && a.date <= clampedEnd) monthAdjustments.push(a);
  }

  // raw.adjustments เรียงจากใหม่ไปเก่ามาแล้ว (orderBy date desc) — ตัด 30 รายการแรกเหมือน take: 30 เดิม
  const adjustments = raw.adjustments.slice(0, 30);

  let running = openingBalance + prefixSales + prefixAdj;
  const adjMap = new Map<string, { total: number; labels: string[] }>();
  for (const a of monthAdjustments) {
    const key = a.date.toISOString().slice(0, 10);
    const existing = adjMap.get(key) ?? { total: 0, labels: [] };
    existing.total += a.amount;
    existing.labels.push(a.label);
    adjMap.set(key, existing);
  }

  // วันที่อยู่ก่อนหรือเท่ากับวันยกมา ไม่ถูกนับเข้ายอดสะสม (ยอดยกมาคือผลรวมของวันพวกนั้นอยู่แล้ว)
  // ถ้าเดือนที่ดูคร่อมวันยกมา (เช่น ตั้งยกมากลางเดือน) แถวก่อนหน้านั้นจะโชว์ "—" แทนยอดสะสม ไม่งั้นจะเหมือนนับซ้ำ
  const rows: { date: Date; today: number; adjustment: number; adjustmentLabels: string[]; running: number | null }[] = [];
  for (let d = new Date(start); d <= clampedEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const today = dailyMap.get(key) ?? 0;
    const adj = adjMap.get(key);
    const counted = d > openingDate;
    if (counted) running += today + (adj?.total ?? 0);
    rows.push({ date: new Date(d), today, adjustment: adj?.total ?? 0, adjustmentLabels: adj?.labels ?? [], running: counted ? running : null });
  }

  return (
    <>
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
              <tr key={r.date.toISOString()} className={`border-t border-gray-100 ${r.running === null ? "text-gray-400" : ""}`}>
                <td className="px-4 py-2">
                  {formatThaiDate(r.date)}
                  {r.running === null && <span className="ml-2 text-[11px]">(ก่อนยอดยกมา — รวมอยู่ในยอดยกมาแล้ว)</span>}
                </td>
                <td className="px-4 py-2 text-right">{formatBaht(r.today)}</td>
                <td className="px-4 py-2 text-right" title={r.adjustmentLabels.join(", ")}>
                  {r.adjustment !== 0 ? (
                    <span className={r.adjustment < 0 ? "text-red-600" : "text-emerald-600"}>{formatBaht(r.adjustment)}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={`px-4 py-2 text-right font-medium ${r.running === null ? "text-gray-300" : r.running < 0 ? "text-red-600" : "text-gray-800"}`}>
                  {r.running === null ? "—" : formatBaht(r.running)}
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
    </>
  );
}
