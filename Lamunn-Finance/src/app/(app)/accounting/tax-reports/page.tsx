import Link from "next/link";
import { requireSectionPage } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { thaiMonthLabel } from "@/lib/format";
import { getAllSettings } from "@/lib/settings";
import MonthFilterBar from "@/components/MonthFilterBar";
import TaxReportTabs from "@/components/accounting/TaxReportTabs";
import StatementShell from "@/components/accounting/StatementShell";
import { buildPp30 } from "@/lib/accounting/taxReports";
import { fmtSatang } from "@/lib/accounting/money";

export const dynamic = "force-dynamic";

export default async function Pp30Page({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  await requireSectionPage("ACCOUNTING");

  const now = new Date();
  const year = Number(searchParams.year) || now.getUTCFullYear();
  const month = Number(searchParams.month) || now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month - 1);

  const [settings, pp30] = await Promise.all([getAllSettings(), buildPp30(start, end)]);

  // กำหนดยื่น ภ.พ.30 คือวันที่ 15 ของเดือนถัดไป (ยื่นออนไลน์ได้ขยายเวลาเพิ่ม)
  const dueDate = new Date(Date.UTC(year, month, 15));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-900">ภ.พ.30 — แบบแสดงรายการภาษีมูลค่าเพิ่ม</h1>
      <p className="mb-4 text-sm text-gray-500">
        สรุปภาษีขายหักภาษีซื้อของงวด พร้อมกระทบยอดกับบัญชีแยกประเภทให้อัตโนมัติ
      </p>

      <TaxReportTabs />
      <MonthFilterBar basePath="/accounting/tax-reports" year={year} month={month} />

      <div
        className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
          pp30.reconciled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {pp30.reconciled ? (
          <>✓ ยอดในแบบตรงกับบัญชีภาษีขาย/ภาษีซื้อในสมุดรายวัน — พร้อมยื่นได้</>
        ) : (
          <>
            <p className="mb-1 font-semibold">⚠ ยอดในแบบยังไม่ตรงกับบัญชีแยกประเภท</p>
            <ul className="list-disc space-y-0.5 pl-5 text-xs">
              {pp30.outputDiff !== 0 && (
                <li>
                  ภาษีขาย: เอกสาร {fmtSatang(pp30.outputVat, { zeroDash: false })} · บัญชี{" "}
                  {fmtSatang(pp30.glOutputVat, { zeroDash: false })} — ต่างกัน {fmtSatang(Math.abs(pp30.outputDiff), { zeroDash: false })}
                </li>
              )}
              {pp30.inputDiff !== 0 && (
                <li>
                  ภาษีซื้อ (ที่ขอเครดิตได้): เอกสาร {fmtSatang(pp30.inputVat, { zeroDash: false })} · บัญชี{" "}
                  {fmtSatang(pp30.glInputVat, { zeroDash: false })} — ต่างกัน {fmtSatang(Math.abs(pp30.inputDiff), { zeroDash: false })}
                </li>
              )}
            </ul>
            <p className="mt-1 text-xs">
              แปลว่ามีเอกสารที่ยังไม่ได้ลงบัญชี หรือมีรายการที่ลงบัญชีแต่ไม่มีเอกสารรองรับ — เคลียร์ให้ตรงก่อนยื่น
            </p>
          </>
        )}
      </div>

      <StatementShell
        companyName={settings.companyName}
        title="ภ.พ.30 — ภาษีมูลค่าเพิ่ม"
        subtitle={`สำหรับเดือนภาษี ${thaiMonthLabel(year, month - 1)} · กำหนดยื่นภายในวันที่ 15 ${thaiMonthLabel(dueDate.getUTCFullYear(), dueDate.getUTCMonth())}`}
      >
        <table className="w-full min-w-[34rem] text-sm">
          <tbody className="tabular-nums">
            <tr>
              <td colSpan={2} className="pb-1 pt-2 font-semibold text-gray-800">
                ภาษีขาย
              </td>
            </tr>
            <Row label="ยอดขายที่ต้องเสียภาษี (ก่อน VAT)" value={pp30.outputBase} />
            <Row label="ภาษีขายในเดือนนี้" value={pp30.outputVat} bold />

            <tr>
              <td colSpan={2} className="pb-1 pt-4 font-semibold text-gray-800">
                ภาษีซื้อ
              </td>
            </tr>
            <Row label="ยอดซื้อที่มีภาษีซื้อ (ก่อน VAT)" value={pp30.inputBase} />
            <Row label="ภาษีซื้อที่ขอเครดิตได้" value={pp30.inputVat} bold />
            {pp30.nonClaimableVat !== 0 && (
              <Row label="ภาษีซื้อต้องห้าม (ไม่นำมาหักในแบบ)" value={pp30.nonClaimableVat} />
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 text-base font-bold tabular-nums">
              <td className="py-3">{pp30.netVat >= 0 ? "ภาษีที่ต้องชำระ" : "ภาษีที่ชำระเกิน (ขอคืน/ยกไปเดือนหน้า)"}</td>
              <td className={`py-3 text-right ${pp30.netVat >= 0 ? "text-gray-900" : "text-emerald-600"}`}>
                {fmtSatang(Math.abs(pp30.netVat), { zeroDash: false })}
              </td>
            </tr>
          </tfoot>
        </table>
      </StatementShell>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/accounting/tax-reports/output-vat?year=${year}&month=${month}`}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-brand-300"
        >
          <p className="text-sm font-medium text-gray-800">ดูรายงานภาษีขาย →</p>
          <p className="mt-0.5 text-xs text-gray-500">รายละเอียดใบกำกับทุกใบที่ต้องแนบไปกับแบบ</p>
        </Link>
        <Link
          href={`/accounting/tax-reports/input-vat?year=${year}&month=${month}`}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-brand-300"
        >
          <p className="text-sm font-medium text-gray-800">ดูรายงานภาษีซื้อ →</p>
          <p className="mt-0.5 text-xs text-gray-500">บันทึกใบกำกับซื้อเพิ่มได้ที่หน้านั้น</p>
        </Link>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        อัตราภาษีมูลค่าเพิ่มที่ระบบใช้อยู่: {(Number(settings.vatRate) * 100).toFixed(0)}% · กำหนดยื่นข้างต้นเป็นกรอบของการยื่นแบบกระดาษ
        ยื่นออนไลน์มักได้ขยายเวลาเพิ่ม ควรให้ผู้ทำบัญชียืนยันวันจริงอีกครั้ง
      </p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <tr className={`border-b border-gray-100 ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
      <td className="py-1.5 pl-5">{label}</td>
      <td className="w-44 py-1.5 text-right">{fmtSatang(value, { zeroDash: false })}</td>
    </tr>
  );
}
