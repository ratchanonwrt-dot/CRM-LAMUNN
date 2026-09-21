"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPercent, thaiMonthLabel } from "@/lib/format";

interface HistoryEntry {
  id: string;
  effectiveYear: number;
  effectiveMonth: number;
  gpPercentStorefront: number;
  gpPercentDelivery: number;
  note: string | null;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default function GpRateHistoryManager({
  branchId,
  history,
  baseGpPercentStorefront,
  baseGpPercentDelivery,
}: {
  branchId: string;
  history: HistoryEntry[];
  baseGpPercentStorefront: number;
  baseGpPercentDelivery: number;
}) {
  const router = useRouter();
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState((now.getUTCFullYear()).toString());
  const [month, setMonth] = useState((now.getUTCMonth() + 1).toString());
  const [gpStorefront, setGpStorefront] = useState(baseGpPercentStorefront.toString());
  const [gpDelivery, setGpDelivery] = useState(baseGpPercentDelivery.toString());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/gp-rate-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, effectiveYear: year, effectiveMonth: month, gpPercentStorefront: gpStorefront, gpPercentDelivery: gpDelivery, note }),
    });
    setSaving(false);
    setNote("");
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("ลบการปรับ GP รายการนี้?")) return;
    await fetch(`/api/gp-rate-history/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-gray-700">ประวัติการปรับ GP รายเดือน</h2>
      <p className="mb-3 text-xs text-gray-400">
        ตั้งค่า GP ใหม่ให้มีผล "ตั้งแต่เดือนที่เลือกเป็นต้นไป" — เดือนก่อนหน้ายังคงคำนวณด้วย GP เดิม (หรือ GP ที่ปรับไว้ก่อนหน้านั้น) ค่าเช่าย้อนหลังจะไม่เปลี่ยน
      </p>

      {history.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">มีผลตั้งแต่</th>
                <th className="px-3 py-2 text-right">GP หน้าร้าน</th>
                <th className="px-3 py-2 text-right">GP Delivery</th>
                <th className="px-3 py-2">หมายเหตุ</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {thaiMonthLabel(h.effectiveYear, h.effectiveMonth - 1)}
                  </td>
                  <td className="px-3 py-2 text-right">{formatPercent(h.gpPercentStorefront)}</td>
                  <td className="px-3 py-2 text-right">{formatPercent(h.gpPercentDelivery)}</td>
                  <td className="px-3 py-2 text-gray-500">{h.note ?? "-"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleDelete(h.id)} className="text-xs text-red-500 hover:underline">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          + ปรับ GP เดือนนี้เป็นต้นไป
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">มีผลตั้งแต่ปี (ค.ศ.)</label>
            <input required type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">เดือน</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400">
              {THAI_MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">GP หน้าร้าน (เช่น 0.25)</label>
            <input required type="number" step="0.01" value={gpStorefront} onChange={(e) => setGpStorefront(e.target.value)} className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">GP Delivery</label>
            <input required type="number" step="0.01" value={gpDelivery} onChange={(e) => setGpDelivery(e.target.value)} className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </div>
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            ยกเลิก
          </button>
        </form>
      )}
    </div>
  );
}
