import Link from "next/link";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import StatementShell from "@/components/accounting/StatementShell";
import { loadBalances, buildBalanceSheet, type StatementSection } from "@/lib/accounting/reports";
import { fmtSatang } from "@/lib/accounting/money";
import { shortThaiDate } from "@/lib/accounting/fiscal";

export const dynamic = "force-dynamic";

export default async function BalanceSheetPage({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("ACCOUNTING");

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { end } = monthRange(year, month - 1);

  const settings = await getAllSettings();
  // ไม่ส่ง from มา = ยอดสะสมตั้งแต่เปิดกิจการจนถึงสิ้นเดือนที่เลือก (งบดุลเป็นงบ ณ วันใดวันหนึ่งเสมอ)
  const balances = await loadBalances({ to: end });
  const bs = buildBalanceSheet(balances);

  const hasData = bs.totalAssets !== 0 || bs.totalLiabilitiesAndEquity !== 0;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">งบแสดงฐานะการเงิน (งบดุล)</h1>
      <p className="mb-4 text-sm text-gray-500">
        สินทรัพย์ หนี้สิน และส่วนของผู้ถือหุ้น ณ วันสิ้นเดือนที่เลือก — ยอดสะสมตั้งแต่เปิดกิจการ
      </p>

      <MonthFilterBar basePath="/accounting/balance-sheet" year={year} month={month} />

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-700">ยังไม่มียอดคงเหลือให้แสดง</p>
          <p className="mt-1 text-sm text-gray-500">
            เริ่มจากคีย์ยอดยกมาของทุกบัญชีเป็นใบสำคัญใบแรกที่{" "}
            <Link href="/accounting/journal/new" className="text-brand-700 underline">สมุดรายวัน</Link>
          </p>
        </div>
      ) : (
        <>
          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              bs.difference === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {bs.difference === 0 ? (
              <>✓ งบดุล — สินทรัพย์รวมเท่ากับหนี้สินและส่วนของผู้ถือหุ้นรวม</>
            ) : (
              <>✗ งบไม่ดุล ต่างกัน {fmtSatang(Math.abs(bs.difference))} บาท — ตรวจงบทดลองก่อน</>
            )}
          </div>

          <StatementShell
            companyName={settings.companyName}
            title="งบแสดงฐานะการเงิน"
            subtitle={`ณ วันที่ ${shortThaiDate(end)}`}
          >
            <div className="grid gap-8 md:grid-cols-2">
              {/* ฝั่งสินทรัพย์ */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2 text-left text-sm font-bold text-gray-900">สินทรัพย์</th>
                    <th className="w-36 py-2 text-right" />
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <Section s={bs.currentAssets} />
                  <Section s={bs.nonCurrentAssets} />
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800 font-bold">
                    <td className="py-2">รวมสินทรัพย์</td>
                    <td className="py-2 text-right tabular-nums">{fmtSatang(bs.totalAssets, { zeroDash: false })}</td>
                  </tr>
                </tfoot>
              </table>

              {/* ฝั่งหนี้สินและส่วนของผู้ถือหุ้น */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-2 text-left text-sm font-bold text-gray-900">หนี้สินและส่วนของผู้ถือหุ้น</th>
                    <th className="w-36 py-2 text-right" />
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <Section s={bs.currentLiabilities} />
                  <Section s={bs.nonCurrentLiabilities} />
                  <tr className="border-b border-gray-200 font-medium text-gray-800">
                    <td className="py-1.5">รวมหนี้สิน</td>
                    <td className="py-1.5 text-right">{fmtSatang(bs.totalLiabilities, { zeroDash: false })}</td>
                  </tr>

                  <Section s={bs.equity} extraLine={{ nameTh: "กำไร(ขาดทุน)สะสมที่ยังไม่ปิดบัญชี", amount: bs.unclosedProfit }} />
                  <tr className="border-b border-gray-200 font-medium text-gray-800">
                    <td className="py-1.5">รวมส่วนของผู้ถือหุ้น</td>
                    <td className="py-1.5 text-right">{fmtSatang(bs.totalEquity, { zeroDash: false })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-800 font-bold">
                    <td className="py-2">รวมหนี้สินและส่วนของผู้ถือหุ้น</td>
                    <td className="py-2 text-right tabular-nums">{fmtSatang(bs.totalLiabilitiesAndEquity, { zeroDash: false })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </StatementShell>
        </>
      )}
    </div>
  );
}

function Section({ s, extraLine }: { s: StatementSection; extraLine?: { nameTh: string; amount: number } }) {
  if (s.lines.length === 0 && !extraLine) return null;
  return (
    <>
      <tr>
        <td colSpan={2} className="pt-3 pb-1 font-semibold text-gray-800">
          {s.title}
        </td>
      </tr>
      {s.lines.map((l) => (
        <tr key={l.code} className="text-gray-600">
          <td className="py-1 pl-5">
            <span className="mr-2 font-mono text-xs text-gray-400">{l.code}</span>
            {l.nameTh}
          </td>
          <td className={`py-1 text-right ${l.amount < 0 ? "text-rose-600" : ""}`}>{fmtSatang(l.amount)}</td>
        </tr>
      ))}
      {extraLine && (
        <tr className="text-gray-600">
          <td className="py-1 pl-5">{extraLine.nameTh}</td>
          <td className={`py-1 text-right ${extraLine.amount < 0 ? "text-rose-600" : ""}`}>
            {fmtSatang(extraLine.amount, { zeroDash: false })}
          </td>
        </tr>
      )}
    </>
  );
}
