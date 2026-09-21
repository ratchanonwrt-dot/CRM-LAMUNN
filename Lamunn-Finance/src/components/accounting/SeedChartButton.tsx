"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import { Download } from "lucide-react";

/** ติดตั้งผังบัญชีเริ่มต้นสำหรับร้านอาหาร/เบเกอรี่ — กดซ้ำได้ ไม่ทับบัญชีที่แก้ไว้แล้ว */
export default function SeedChartButton({ hasAccounts }: { hasAccounts: boolean }) {
  const { refresh, refreshing } = useServerRefresh();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setSubmitting(true);
    setMsg(null);
    const res = await fetch("/api/accounting/accounts/seed", { method: "POST" });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setMsg(data.error ?? "ติดตั้งไม่สำเร็จ");
      return;
    }
    setMsg(data.created === 0 ? "ผังบัญชีครบอยู่แล้ว ไม่มีบัญชีใหม่ต้องเพิ่ม" : `เพิ่มบัญชีใหม่ ${data.created} บัญชี`);
    refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        <Download size={15} />
        {busy ? "กำลังติดตั้ง..." : hasAccounts ? "เติมบัญชีมาตรฐานที่ยังขาด" : "ติดตั้งผังบัญชีเริ่มต้น"}
      </button>
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </div>
  );
}
