"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

const inputCls = "w-28 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm tabular-nums outline-none focus:border-brand-400 focus:bg-white";

export default function PaySettingsForm({ settings }: { settings: { shippingPct: number; commissionPct: number; minHourly: number } }) {
  const router = useRouter();
  const canEdit = useCanEdit();
  const [shippingPct, setShippingPct] = useState(String(settings.shippingPct));
  const [commissionPct, setCommissionPct] = useState(String(settings.commissionPct));
  const [minHourly, setMinHourly] = useState(String(settings.minHourly));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/pay-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingPct, commissionPct, minHourly }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">หักค่าส่งก่อน (%)</label>
        <input type="number" step="0.01" min={0} max={100} disabled={!canEdit} value={shippingPct} onChange={(e) => setShippingPct(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">คอมมิชชั่น (%)</label>
        <input type="number" step="0.01" min={0} max={100} disabled={!canEdit} value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ขั้นต่ำต่อชั่วโมง (บาท)</label>
        <input type="number" step="1" min={0} disabled={!canEdit} value={minHourly} onChange={(e) => setMinHourly(e.target.value)} className={inputCls} />
      </div>
      {canEdit && (
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึกอัตรา"}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">บันทึกแล้ว</p>}
      <p className="w-full text-[11px] text-gray-400">สูตร: ยอดขาย × (1 − ค่าส่ง%) × คอม% เทียบกับ ขั้นต่ำ × ชั่วโมง จ่ายตัวที่มากกว่า · เปลี่ยนอัตราแล้วมีผลกับทุกกะที่ยังไม่ได้จ่าย (ระบบคิดใหม่ทุกครั้งที่เปิดดู)</p>
    </form>
  );
}
