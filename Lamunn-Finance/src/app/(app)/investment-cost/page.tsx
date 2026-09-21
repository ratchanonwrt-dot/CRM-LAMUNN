import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import { formatBaht, formatThaiDate } from "@/lib/format";
import AddInvestmentCostForm from "@/components/AddInvestmentCostForm";
import DeleteInvestmentCostButton from "@/components/DeleteInvestmentCostButton";
import InvestmentResaleCell from "@/components/InvestmentResaleCell";

export const dynamic = "force-dynamic";

/** จดค่าใช้จ่ายลงทุนก้อนใหญ่ที่จ่ายไปครั้งเดียว (เช่น ซื้ออุปกรณ์/รีโนเวท) แล้วรวมยอดสะสมให้
 * ไม่ผูกกับระบบบัญชีคู่ — แค่จดกับรวม ใช้ดูภาพรวมว่าลงทุนไปแล้วเท่าไหร่ */
export default async function InvestmentCostPage() {
  await requireSectionPage("INVESTMENT_COST");

  const items = await prisma.investmentCost.findMany({ orderBy: { date: "desc" } });
  const total = items.reduce((a, i) => a + i.amount, 0);
  // มูลค่าที่น่าจะขายทิ้งได้รวม — นับเฉพาะรายการที่กรอกไว้ (รายการที่ยังไม่กรอกไม่นับ ไม่ใช่ถือว่าเป็น 0)
  const totalResale = items.reduce((a, i) => a + (i.resaleValue ?? 0), 0);
  const resaleCount = items.filter((i) => i.resaleValue != null).length;

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ค่าใช้จ่ายลงทุน (Investment Cost)</h1>
      <p className="mb-6 text-sm text-gray-500">จดค่าใช้จ่ายก้อนใหญ่ที่เคยจ่ายไปครั้งเดียว (ซื้ออุปกรณ์/รีโนเวท ฯลฯ) — ระบบรวมยอดสะสมให้</p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs text-brand-700">ยอดลงทุนสะสมทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{formatBaht(total)} บาท</p>
          <p className="mt-1 text-xs text-brand-600">{items.length.toLocaleString()} รายการ</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">ราคาที่น่าจะขายทิ้งได้รวม</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{formatBaht(totalResale)} บาท</p>
          <p className="mt-1 text-xs text-emerald-600">
            กรอกไว้ {resaleCount.toLocaleString()} จาก {items.length.toLocaleString()} รายการ
            {resaleCount > 0 && total > 0 && ` · คิดเป็น ${((totalResale / total) * 100).toFixed(0)}% ของยอดลงทุน`}
          </p>
        </div>
      </div>

      <AddInvestmentCostForm />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่จ่าย</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2 text-right">จำนวนเงิน</th>
              <th className="px-4 py-2 text-right">ราคาที่น่าจะขายทิ้งได้</th>
              <th className="px-4 py-2">หมายเหตุ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-500">{formatThaiDate(i.date)}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{i.description}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-800">{formatBaht(i.amount)}</td>
                <td className="px-4 py-2 text-right text-emerald-700">
                  <InvestmentResaleCell id={i.id} value={i.resaleValue} />
                </td>
                <td className="px-4 py-2 text-gray-500">{i.note ?? "-"}</td>
                <td className="px-4 py-2">
                  <DeleteInvestmentCostButton id={i.id} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>
                  ยังไม่มีรายการ
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="border-t-2 border-gray-200 bg-gray-50 text-sm font-bold">
              <tr>
                <td className="px-4 py-2 text-gray-800" colSpan={2}>
                  รวมทั้งหมด
                </td>
                <td className="px-4 py-2 text-right text-brand-700">{formatBaht(total)}</td>
                <td className="px-4 py-2 text-right text-emerald-700">{formatBaht(totalResale)}</td>
                <td className="px-4 py-2" colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
