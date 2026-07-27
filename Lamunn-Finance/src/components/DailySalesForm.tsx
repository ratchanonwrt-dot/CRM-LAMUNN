"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExistingRow {
  cashPos: number | null;
  cashCounted: number | null;
  transfer: number | null;
  cashTransferCombined: number | null;
  grab: number;
  lineman: number;
  posCheckTotal: number | null;
  note: string | null;
}

export default function DailySalesForm({
  branchId,
  branchType,
  date,
  existing,
}: {
  branchId: string;
  branchType: "CASH" | "CREDIT_TERM";
  date: string;
  existing: ExistingRow | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    cashPos: existing?.cashPos?.toString() ?? "",
    cashCounted: existing?.cashCounted?.toString() ?? "",
    transfer: existing?.transfer?.toString() ?? "",
    cashTransferCombined: existing?.cashTransferCombined?.toString() ?? "",
    grab: existing?.grab?.toString() ?? "",
    lineman: existing?.lineman?.toString() ?? "",
    posCheckTotal: existing?.posCheckTotal?.toString() ?? "",
    note: existing?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field(key: keyof typeof form, label: string, opts?: { step?: string }) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
        <input
          type={key === "note" ? "text" : "number"}
          step={opts?.step ?? "0.01"}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/daily-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, date, ...form }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const storefrontTotal =
    branchType === "CASH"
      ? (Number(form.cashPos) || 0) + (Number(form.transfer) || 0)
      : Number(form.cashTransferCombined) || 0;
  const deliveryTotal = (Number(form.grab) || 0) + (Number(form.lineman) || 0);

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">หน้าร้าน (Storefront)</h2>
      {branchType === "CASH" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {field("cashPos", "เงินสด POS")}
          {field("cashCounted", "เงินสดนับ (ส่งกลับครัวกลาง)")}
          {field("transfer", "เงินโอน")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("cashTransferCombined", "เงินสด + เงินโอน (รวม)")}
        </div>
      )}

      <h2 className="mb-4 mt-6 text-sm font-semibold text-gray-700">Delivery</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field("grab", "Grab")}
        {field("lineman", "Lineman")}
        {field("posCheckTotal", "ยอดรวม POS (เช็คยอด, ไม่บังคับ)")}
      </div>

      <div className="mt-6">{field("note", "หมายเหตุ")}</div>

      <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">รวมหน้าร้าน:</span>
        <span className="font-semibold text-gray-800">{storefrontTotal.toLocaleString("th-TH")}</span>
        <span className="text-gray-500">รวม Delivery:</span>
        <span className="font-semibold text-gray-800">{deliveryTotal.toLocaleString("th-TH")}</span>
        <span className="text-gray-500">รวมทั้งหมด:</span>
        <span className="font-bold text-brand-700">{(storefrontTotal + deliveryTotal).toLocaleString("th-TH")}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="mt-3 text-sm text-emerald-600">บันทึกแล้ว</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
