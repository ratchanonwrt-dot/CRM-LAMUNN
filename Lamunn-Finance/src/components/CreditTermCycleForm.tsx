"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CycleData {
  splitMonth: boolean;
  period1PayDay: number | null;
  period1PayMonthOffset: number;
  period2PayDay: number | null;
  period2PayMonthOffset: number;
  fullMonthPayDay: number | null;
  fullMonthPayMonthOffset: number;
  deductDeliveryGp: boolean;
}

export default function CreditTermCycleForm({
  branchId,
  branchName,
  gpPercentStorefront,
  gpPercentDelivery,
  cycle,
}: {
  branchId: string;
  branchName: string;
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  cycle: CycleData | null;
}) {
  const router = useRouter();
  const [splitMonth, setSplitMonth] = useState(cycle?.splitMonth ?? true);
  const [period1PayDay, setPeriod1PayDay] = useState(cycle?.period1PayDay?.toString() ?? "30");
  const [period1PayMonthOffset, setPeriod1PayMonthOffset] = useState((cycle?.period1PayMonthOffset ?? 0).toString());
  const [period2PayDay, setPeriod2PayDay] = useState(cycle?.period2PayDay?.toString() ?? "1");
  const [period2PayMonthOffset, setPeriod2PayMonthOffset] = useState((cycle?.period2PayMonthOffset ?? 1).toString());
  const [fullMonthPayDay, setFullMonthPayDay] = useState(cycle?.fullMonthPayDay?.toString() ?? "25");
  const [fullMonthPayMonthOffset, setFullMonthPayMonthOffset] = useState((cycle?.fullMonthPayMonthOffset ?? 1).toString());
  const [deductDeliveryGp, setDeductDeliveryGp] = useState(cycle?.deductDeliveryGp ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch(`/api/branches/${branchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CREDIT_TERM",
        creditTerm: {
          splitMonth,
          period1PayDay,
          period1PayMonthOffset,
          period2PayDay,
          period2PayMonthOffset,
          fullMonthPayDay,
          fullMonthPayMonthOffset,
          deductDeliveryGp,
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{branchName}</h2>
        <span className="text-xs text-gray-400">
          GP หน้าร้าน {(gpPercentStorefront * 100).toFixed(0)}% · GP Delivery {(gpPercentDelivery * 100).toFixed(0)}%
        </span>
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={splitMonth} onChange={(e) => setSplitMonth(e.target.checked)} />
        แบ่ง 2 รอบต่อเดือน (1-15 และ 16-สิ้นเดือน)
      </label>

      {splitMonth ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">รอบ 1-15: วันที่จ่าย</label>
            <input type="number" value={period1PayDay} onChange={(e) => setPeriod1PayDay(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">รอบ 1-15: เดือน</label>
            <select value={period1PayMonthOffset} onChange={(e) => setPeriod1PayMonthOffset(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="0">เดือนเดียวกัน</option>
              <option value="1">เดือนถัดไป</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">รอบ 16-สิ้นเดือน: วันที่จ่าย</label>
            <input type="number" value={period2PayDay} onChange={(e) => setPeriod2PayDay(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">รอบ 16-สิ้นเดือน: เดือน</label>
            <select value={period2PayMonthOffset} onChange={(e) => setPeriod2PayMonthOffset(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="0">เดือนเดียวกัน</option>
              <option value="1">เดือนถัดไป</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เต็มเดือน: วันที่จ่าย</label>
            <input type="number" value={fullMonthPayDay} onChange={(e) => setFullMonthPayDay(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เต็มเดือน: เดือน</label>
            <select value={fullMonthPayMonthOffset} onChange={(e) => setFullMonthPayMonthOffset(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="0">เดือนเดียวกัน</option>
              <option value="1">เดือนถัดไป</option>
            </select>
          </div>
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={deductDeliveryGp} onChange={(e) => setDeductDeliveryGp(e.target.checked)} />
        หัก GP Delivery ด้วย (ไม่ใช่แค่หน้าร้าน)
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        {saved && !saving && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
      </div>
    </form>
  );
}
