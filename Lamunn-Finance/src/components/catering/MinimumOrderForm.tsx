"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function MinimumOrderForm({ minWithBooth, minNoBooth }: { minWithBooth: number; minNoBooth: number }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [withBooth, setWithBooth] = useState(String(minWithBooth));
  const [noBooth, setNoBooth] = useState(String(minNoBooth));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/catering/minimums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minWithBooth: withBooth, minNoBooth: noBooth }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-gray-700">ยอดสั่งขั้นต่ำ</h2>
      <p className="mb-4 text-xs text-gray-400">ใช้เช็คตอนเพิ่มรายการในแต่ละงาน — ขั้นต่ำต่างกันตามว่ามีบูธไปด้วยหรือไม่</p>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ถ้ามีบูธ (บาท)</label>
          <input
            type="number"
            min="0"
            disabled={!canEdit}
            value={withBooth}
            onChange={(e) => setWithBooth(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ถ้าไม่มีบูธ (บาท)</label>
          <input
            type="number"
            min="0"
            disabled={!canEdit}
            value={noBooth}
            onChange={(e) => setNoBooth(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        {canEdit && (
          <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        )}
        {saved && <span className="text-sm text-emerald-600">บันทึกแล้ว</span>}
      </div>
    </form>
  );
}
