"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

interface BranchRow {
  branchId: string;
  branchName: string;
  billingGroupId: string | null;
  billingDueDays: number | null;
  paymentDelayDays: number | null;
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  mallLegalName: string | null;
}

// เก็บ draft ของช่องกรอกตัวเลข (%, วัน) ต่อสาขา — บันทึกทีเดียวตอนกดปุ่ม ไม่ยิง API ทุกครั้งที่พิมพ์
function useNumberDraft(rows: BranchRow[], key: keyof BranchRow, toDraft: (v: number | null) => string) {
  return useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.branchId, toDraft(r[key] as number | null)])));
}

export default function BranchBillingGroupAssign({
  rows,
  groups,
}: {
  rows: BranchRow[];
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const canEdit = useCanEdit("CREDIT_TERM");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dueDaysDraft, setDueDaysDraft] = useNumberDraft(rows, "billingDueDays", (v) => v?.toString() ?? "");
  const [delayDaysDraft, setDelayDaysDraft] = useNumberDraft(rows, "paymentDelayDays", (v) => v?.toString() ?? "");
  const [storefrontDraft, setStorefrontDraft] = useNumberDraft(rows, "gpPercentStorefront", (v) => (((v ?? 0) * 100).toString()));
  const [deliveryDraft, setDeliveryDraft] = useNumberDraft(rows, "gpPercentDelivery", (v) => (((v ?? 0) * 100).toString()));
  const [legalNameDraft, setLegalNameDraft] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.branchId, r.mallLegalName ?? ""]))
  );

  async function save(branchId: string, body: Record<string, unknown>) {
    if (!canEdit) return;
    setBusyId(branchId);
    await fetch("/api/credit-term/assign-billing-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, ...body }),
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">สาขา</th>
            <th className="px-3 py-2">ประเภทวางบิล</th>
            <th className="px-3 py-2">GP หน้าร้าน %</th>
            <th className="px-3 py-2">GP Delivery %</th>
            <th className="px-3 py-2">วางบิลภายใน (วันหลังจบรอบขาย)</th>
            <th className="px-3 py-2">โอนเงินเข้าหลังวางบิล (วัน)</th>
            <th className="px-3 py-2">ชื่อนิติบุคคลของห้าง (สำหรับใบรับเงิน)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const busy = busyId === r.branchId;
            return (
              <tr key={r.branchId} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{r.branchName}</td>
                <td className="px-3 py-2">
                  <select
                    value={r.billingGroupId ?? ""}
                    disabled={!canEdit || busy}
                    onChange={(e) => save(r.branchId, { billingGroupId: e.target.value || null })}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                  >
                    <option value="">— ไม่ระบุ —</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={storefrontDraft[r.branchId] ?? ""}
                      disabled={!canEdit || busy}
                      onChange={(e) => setStorefrontDraft((d) => ({ ...d, [r.branchId]: e.target.value }))}
                      onBlur={() => save(r.branchId, { gpPercentStorefront: (Number(storefrontDraft[r.branchId]) || 0) / 100 })}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryDraft[r.branchId] ?? ""}
                      disabled={!canEdit || busy}
                      onChange={(e) => setDeliveryDraft((d) => ({ ...d, [r.branchId]: e.target.value }))}
                      onBlur={() => save(r.branchId, { gpPercentDelivery: (Number(deliveryDraft[r.branchId]) || 0) / 100 })}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="เช่น 5"
                      value={dueDaysDraft[r.branchId] ?? ""}
                      disabled={!canEdit || busy}
                      onChange={(e) => setDueDaysDraft((d) => ({ ...d, [r.branchId]: e.target.value }))}
                      onBlur={() => save(r.branchId, { billingDueDays: dueDaysDraft[r.branchId] || null })}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400">วัน</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="เช่น 7"
                      value={delayDaysDraft[r.branchId] ?? ""}
                      disabled={!canEdit || busy}
                      onChange={(e) => setDelayDaysDraft((d) => ({ ...d, [r.branchId]: e.target.value }))}
                      onBlur={() => save(r.branchId, { paymentDelayDays: delayDaysDraft[r.branchId] || null })}
                      className="w-16 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400">วัน</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    placeholder="เช่น บริษัท เดอะมอลล์ กรุ๊ป จำกัด"
                    value={legalNameDraft[r.branchId] ?? ""}
                    disabled={!canEdit || busy}
                    onChange={(e) => setLegalNameDraft((d) => ({ ...d, [r.branchId]: e.target.value }))}
                    onBlur={() => save(r.branchId, { mallLegalName: legalNameDraft[r.branchId] || null })}
                    className="w-56 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none disabled:opacity-50"
                  />
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-gray-400" colSpan={7}>
                ไม่มีสาขาประเภท Credit Term
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
