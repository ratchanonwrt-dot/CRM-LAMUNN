import Link from "next/link";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { thaiMonthLabel } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import StatementShell from "@/components/accounting/StatementShell";
import { loadBalances, buildIncomeStatement, type IncomeStatement, type StatementSection } from "@/lib/accounting/reports";
import { fmtSatang } from "@/lib/accounting/money";
import { fiscalYearStart, shortThaiDate } from "@/lib/accounting/fiscal";

export const dynamic = "force-dynamic";

export default async function IncomeStatementPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("ACCOUNTING");

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  const fyStart = fiscalYearStart(end, Number(settings.fiscalYearStartMonth) || 1);

  // สองคอลัมน์: เฉพาะเดือนที่เลือก และสะสมตั้งแต่ต้นรอบบัญชีถึงสิ้นเดือนนั้น
  const [monthBalances, ytdBalances] = await Promise.all([
    loadBalances({ from: start, to: end }),
    loadBalances({ from: fyStart, to: end }),
  ]);

  const pl = buildIncomeStatement(monthBalances);
  const ytd = buildIncomeStatement(ytdBalances);

  const hasData = pl.revenue.lines.length > 0 || ytd.revenue.lines.length > 0 || pl.netProfit !== 0 || ytd.netProfit !== 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">งบกำไรขาดทุน</h1>
      <p className="mb-4 text-sm text-gray-500">
        รายได้หักต้นทุนและค่าใช้จ่ายของงวด — เทียบเดือนที่เลือกกับยอดสะสมตั้งแต่ต้นรอบบัญชีในตารางเดียว
      </p>

      <MonthFilterBar basePath="/accounting/income-statement" year={year} month={month} />

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">ยังไม่มีรายได้หรือค่าใช้จ่ายที่ผ่านรายการในงวดนี้</p>
          <p className="mt-1 text-sm text-gray-500">
            ลอง <Link href="/accounting/daily-posting" className="text-brand-700 underline">ลงบัญชียอดขายรายวัน</Link> ก่อน
            แล้วกลับมาดูงบใบนี้อีกครั้ง
          </p>
        </div>
      ) : (
        <StatementShell
          companyName={settings.companyName}
          title="งบกำไรขาดทุน"
          subtitle={`สำหรับงวดเดือน ${thaiMonthLabel(year, month - 1)} และสะสมตั้งแต่ ${shortThaiDate(fyStart)} ถึง ${shortThaiDate(end)}`}
        >
          <table className="w-full min-w-[38rem] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 text-left font-medium">รายการ</th>
                <th className="w-40 py-2 px-3 text-right font-medium">{thaiMonthLabel(year, month - 1)}</th>
                <th className="w-40 py-2 pl-3 text-right font-medium">สะสมตั้งแต่ต้นรอบบัญชี</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <Section a={pl.revenue} b={ytd.revenue} />
              <Section a={pl.cogs} b={ytd.cogs} negate />
              <Total label="กำไรขั้นต้น" a={pl.grossProfit} b={ytd.grossProfit} />

              <Section a={pl.otherIncome} b={ytd.otherIncome} />
              <Section a={pl.sellingExpense} b={ytd.sellingExpense} negate />
              <Section a={pl.adminExpense} b={ytd.adminExpense} negate />
              <Total label="กำไร(ขาดทุน)ก่อนต้นทุนทางการเงินและภาษี" a={pl.operatingProfit} b={ytd.operatingProfit} />

              <Section a={pl.financeTax} b={ytd.financeTax} negate />
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800 text-base font-bold tabular-nums">
                <td className="py-2.5 pr-3">กำไร(ขาดทุน)สุทธิ</td>
                <td className={`py-2.5 px-3 text-right ${pl.netProfit < 0 ? "text-rose-600" : "text-gray-900"}`}>
                  {fmtSatang(pl.netProfit, { zeroDash: false })}
                </td>
                <td className={`py-2.5 pl-3 text-right ${ytd.netProfit < 0 ? "text-rose-600" : "text-gray-900"}`}>
                  {fmtSatang(ytd.netProfit, { zeroDash: false })}
                </td>
              </tr>
            </tfoot>
          </table>
        </StatementShell>
      )}
    </div>
  );
}

/** หนึ่งหมวดของงบ: หัวข้อ + บรรทัดบัญชีย่อย + ยอดรวมหมวด
 * `negate` ใช้กับหมวดต้นทุน/ค่าใช้จ่าย เพื่อแสดงเป็น "หัก ..." ให้อ่านง่ายแบบงบจริง */
function Section({ a, b, negate }: { a: StatementSection; b: StatementSection; negate?: boolean }) {
  if (a.lines.length === 0 && b.lines.length === 0) return null;

  // รวมรหัสบัญชีจากทั้งสองคอลัมน์ เพื่อให้บรรทัดตรงกันแม้บางบัญชีมียอดแค่คอลัมน์เดียว
  const codes = [...new Set([...a.lines.map((l) => l.code), ...b.lines.map((l) => l.code)])].sort();
  const aMap = new Map(a.lines.map((l) => [l.code, l]));
  const bMap = new Map(b.lines.map((l) => [l.code, l]));

  return (
    <>
      <tr>
        <td colSpan={3} className="pt-4 pb-1 text-sm font-semibold text-gray-800">
          {negate ? `หัก ${a.title}` : a.title}
        </td>
      </tr>
      {codes.map((code) => {
        const line = aMap.get(code) ?? bMap.get(code)!;
        return (
          <tr key={code} className="text-gray-600">
            <td className="py-1 pr-3 pl-5">
              <span className="mr-2 font-mono text-xs text-gray-400">{code}</span>
              {line.nameTh}
            </td>
            <td className="py-1 px-3 text-right">{fmtSatang(aMap.get(code)?.amount ?? 0)}</td>
            <td className="py-1 pl-3 text-right">{fmtSatang(bMap.get(code)?.amount ?? 0)}</td>
          </tr>
        );
      })}
      <tr className="border-b border-gray-200 font-medium">
        <td className="py-1.5 pr-3 pl-5 text-gray-700">รวม{a.title}</td>
        <td className="py-1.5 px-3 text-right">{fmtSatang(a.total, { zeroDash: false })}</td>
        <td className="py-1.5 pl-3 text-right">{fmtSatang(b.total, { zeroDash: false })}</td>
      </tr>
    </>
  );
}

function Total({ label, a, b }: { label: string; a: number; b: number }) {
  return (
    <tr className="border-b border-gray-300 font-semibold text-gray-900">
      <td className="py-2 pr-3">{label}</td>
      <td className={`py-2 px-3 text-right ${a < 0 ? "text-rose-600" : ""}`}>{fmtSatang(a, { zeroDash: false })}</td>
      <td className={`py-2 pl-3 text-right ${b < 0 ? "text-rose-600" : ""}`}>{fmtSatang(b, { zeroDash: false })}</td>
    </tr>
  );
}
