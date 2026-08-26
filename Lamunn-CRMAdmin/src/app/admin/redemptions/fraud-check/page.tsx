import Link from "next/link";
import { format } from "date-fns";
import { getVoucherFraudCheck } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import { ArrowLeft, AlertTriangle, CheckCircle2, CircleHelp } from "lucide-react";

const statusLabel = {
  mismatch: { text: "ต้องตรวจสอบ", className: "bg-red-50 text-red-600", Icon: AlertTriangle },
  match: { text: "ตรงกัน", className: "bg-brand-50 text-brand-700", Icon: CheckCircle2 },
  no_data: { text: "ไม่มีข้อมูล POS เทียบ", className: "bg-gray-100 text-gray-500", Icon: CircleHelp },
} as const;

export default async function FraudCheckPage() {
  await requirePageRole("redemptions");
  const rows = await getVoucherFraudCheck({ days: 14 });

  const mismatchCount = rows.filter((r) => r.status === "mismatch").length;
  const noDataCount = rows.filter((r) => r.status === "no_data").length;
  const matchCount = rows.filter((r) => r.status === "match").length;

  return (
    <div>
      <Link href="/admin/redemptions/history" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} />
        กลับไปหน้าประวัติ
      </Link>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ตรวจสอบคูปองย้อนหลังกับ POS (14 วันล่าสุด)</h1>
      <p className="mb-6 text-sm text-gray-500">
        เทียบจำนวนคูปองส่วนลดที่พนักงานยืนยันใน CRM กับจำนวนบิลที่มีส่วนลดตรงกันในระบบ POS อัตโนมัติ ต่อสาขาต่อวัน — ใช้ได้เฉพาะสาขาที่ POS
        เชื่อมกับระบบนี้อยู่ (ไม่รวมสาขาที่ใช้ Wongnai หรือสาขาที่ข้อมูล POS ค้างเกิน 3 วัน จะขึ้น &quot;ไม่มีข้อมูล POS เทียบ&quot; แทน ไม่ใช่ธงเตือน)
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ต้องตรวจสอบ</p>
          <p className="text-2xl font-bold text-red-600">{mismatchCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ตรงกัน</p>
          <p className="text-2xl font-bold text-brand-700">{matchCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ไม่มีข้อมูล POS เทียบ</p>
          <p className="text-2xl font-bold text-gray-500">{noDataCount}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">คูปอง</th>
              <th className="px-4 py-2">ยืนยันใน CRM</th>
              <th className="px-4 py-2">บิลลดราคาใน POS</th>
              <th className="px-4 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีข้อมูลในช่วง 14 วันล่าสุด
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const s = statusLabel[r.status];
              const Icon = s.Icon;
              return (
                <tr key={`${r.branchCode}-${r.date}-${r.rewardName}-${i}`} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{format(new Date(`${r.date}T00:00:00`), "d MMM yyyy")}</td>
                  <td className="px-4 py-2">{r.branchName}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {r.rewardName} <span className="text-gray-400">(ลด {r.discountAmount} บ.)</span>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">{r.crmConfirmedCount}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{r.posMatchingBillCount ?? "-"}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.className}`}>
                      <Icon size={12} />
                      {s.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
