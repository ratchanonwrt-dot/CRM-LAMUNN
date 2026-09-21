import Link from "next/link";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { thaiMonthLabel } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import StatementShell from "@/components/accounting/StatementShell";
import { loadBalances, buildTrialBalance } from "@/lib/accounting/reports";
import { fmtSatang } from "@/lib/accounting/money";
import { shortThaiDate } from "@/lib/accounting/fiscal";

export const dynamic = "force-dynamic";

export default async function TrialBalancePage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("ACCOUNTING");

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  const balances = await loadBalances({ from: start, to: end });
  const tb = buildTrialBalance(balances);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">งบทดลอง</h1>
      <p className="mb-4 text-sm text-gray-500">
        รวมยอดทุกบัญชีในงวด เพื่อตรวจว่าเดบิตเท่ากับเครดิตก่อนปิดงบ — นับเฉพาะใบสำคัญที่ผ่านรายการแล้ว
      </p>

      <MonthFilterBar basePath="/accounting/trial-balance" year={year} month={month} />

      {tb.rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              tb.balanced ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {tb.balanced ? (
              <>✓ งบทดลองลงตัว — เดบิตรวมเท่ากับเครดิตรวม พร้อมออกงบการเงินได้</>
            ) : (
              <>
                ✗ งบทดลองไม่ลงตัว เดบิตรวม {fmtSatang(tb.totalDebit)} เครดิตรวม {fmtSatang(tb.totalCredit)} — ต่างกัน{" "}
                {fmtSatang(Math.abs(tb.totalDebit - tb.totalCredit))} บาท ตรวจสมุดรายวันก่อนออกงบ
              </>
            )}
          </div>

          <StatementShell
            companyName={settings.companyName}
            title="งบทดลอง"
            subtitle={`สำหรับงวดเดือน ${thaiMonthLabel(year, month - 1)} (${shortThaiDate(start)} – ${shortThaiDate(end)})`}
          >
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3 text-left font-medium">รหัส</th>
                  <th className="py-2 pr-3 text-left font-medium">ชื่อบัญชี</th>
                  <th className="py-2 px-3 text-right font-medium">ยกมา เดบิต</th>
                  <th className="py-2 px-3 text-right font-medium">ยกมา เครดิต</th>
                  <th className="py-2 px-3 text-right font-medium">เดบิต</th>
                  <th className="py-2 px-3 text-right font-medium">เครดิต</th>
                  <th className="py-2 px-3 text-right font-medium">ยกไป เดบิต</th>
                  <th className="py-2 pl-3 text-right font-medium">ยกไป เครดิต</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {tb.rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="py-1.5 pr-3 font-mono text-xs text-gray-500">{r.code}</td>
                    <td className="py-1.5 pr-3">
                      <Link href={`/accounting/journal?accountId=${r.id}&year=${year}&month=${month}`} className="hover:text-brand-700 hover:underline">
                        {r.nameTh}
                      </Link>
                    </td>
                    <td className="py-1.5 px-3 text-right text-gray-600">{fmtSatang(r.opening > 0 ? r.opening : 0)}</td>
                    <td className="py-1.5 px-3 text-right text-gray-600">{fmtSatang(r.opening < 0 ? -r.opening : 0)}</td>
                    <td className="py-1.5 px-3 text-right">{fmtSatang(r.debit)}</td>
                    <td className="py-1.5 px-3 text-right">{fmtSatang(r.credit)}</td>
                    <td className="py-1.5 px-3 text-right font-medium">{fmtSatang(r.closing > 0 ? r.closing : 0)}</td>
                    <td className="py-1.5 pl-3 text-right font-medium">{fmtSatang(r.closing < 0 ? -r.closing : 0)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 font-semibold tabular-nums">
                  <td className="py-2 pr-3" colSpan={2}>
                    รวม
                  </td>
                  <td className="py-2 px-3 text-right">{fmtSatang(tb.totalOpeningDr)}</td>
                  <td className="py-2 px-3 text-right">{fmtSatang(tb.totalOpeningCr)}</td>
                  <td className="py-2 px-3 text-right">{fmtSatang(tb.totalDebit)}</td>
                  <td className="py-2 px-3 text-right">{fmtSatang(tb.totalCredit)}</td>
                  <td className="py-2 px-3 text-right">{fmtSatang(tb.totalClosingDr)}</td>
                  <td className="py-2 pl-3 text-right">{fmtSatang(tb.totalClosingCr)}</td>
                </tr>
              </tfoot>
            </table>
          </StatementShell>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <p className="text-sm font-medium text-gray-700">ยังไม่มีรายการบัญชีในงวดนี้</p>
      <p className="mt-1 text-sm text-gray-500">
        เริ่มจาก <Link href="/accounting/accounts" className="text-brand-700 underline">ติดตั้งผังบัญชี</Link> แล้ว{" "}
        <Link href="/accounting/daily-posting" className="text-brand-700 underline">ลงบัญชียอดขายรายวัน</Link> หรือ{" "}
        <Link href="/accounting/journal/new" className="text-brand-700 underline">คีย์ใบสำคัญเอง</Link>
      </p>
    </div>
  );
}
