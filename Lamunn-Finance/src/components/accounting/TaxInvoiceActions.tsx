"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";

/** ปุ่มของใบกำกับหนึ่งใบ — "ลงบัญชี" โผล่เฉพาะใบที่ขายนอกยอดรวม (ใบในยอดรวมลงไปกับยอดขายรายวันแล้ว) */
export default function TaxInvoiceActions({
  invoiceId,
  voided,
  needsPosting,
  posted,
}: {
  invoiceId: string;
  voided: boolean;
  needsPosting: boolean;
  posted: boolean;
}) {
  const { refresh, refreshing } = useServerRefresh();
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [error, setError] = useState<string | null>(null);

  async function run(action: "void" | "post") {
    if (action === "void" && !confirm("ยกเลิกใบกำกับนี้?")) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/accounting/tax-invoices/${invoiceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    refresh();
  }

  if (voided) return <span className="text-xs text-gray-400">ยกเลิกแล้ว</span>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {error && <span className="w-full text-right text-xs text-rose-600">{error}</span>}
      {needsPosting && !posted && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run("post")}
          className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          ลงบัญชี
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => run("void")}
        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        ยกเลิก
      </button>
    </div>
  );
}
