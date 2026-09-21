"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import { Lock, Unlock } from "lucide-react";

/** ปิด/เปิดงวดบัญชี — ปิดแล้วบันทึกย้อนหลังไม่ได้ ต้องออกใบสำคัญปรับปรุงในงวดถัดไปแทน */
export default function PeriodCloseButton({ year, month, closed }: { year: number; month: number; closed: boolean }) {
  const { refresh, refreshing } = useServerRefresh();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const action = closed ? "reopen" : "close";
    if (!closed && !confirm("ปิดงวดนี้? หลังปิดแล้วจะบันทึกหรือแก้ไขรายการในงวดนี้ไม่ได้อีก")) return;

    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/accounting/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, action }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    refresh();
  }

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${
          closed ? "border border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-gray-800 text-white hover:bg-gray-900"
        }`}
      >
        {closed ? <Unlock size={15} /> : <Lock size={15} />}
        {busy ? "กำลังทำรายการ..." : closed ? "เปิดงวดอีกครั้ง" : "ปิดงวดนี้"}
      </button>
      {error && <p className="mt-2 max-w-xs text-xs text-rose-600">{error}</p>}
    </div>
  );
}
