"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";

/** ปุ่มยกเลิกเอกสารภาษี (ใบกำกับซื้อ / หนังสือรับรองหัก ณ ที่จ่าย)
 * ยกเลิกแทนการลบเสมอ เพราะเอกสารภาษีที่เคยออกไปแล้วต้องตรวจย้อนหลังได้ */
export default function VoidDocButton({ endpoint, id, label = "ยกเลิก" }: { endpoint: string; id: string; label?: string }) {
  const { refresh, refreshing } = useServerRefresh();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirm("ยกเลิกเอกสารนี้? ยอดจะถูกถอดออกจากรายงานภาษีของงวดนี้")) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`${endpoint}/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ยกเลิกไม่สำเร็จ");
      return;
    }
    refresh();
  }

  return (
    <span className="whitespace-nowrap">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        {label}
      </button>
      {error && <span className="ml-2 text-xs text-rose-600">{error}</span>}
    </span>
  );
}
