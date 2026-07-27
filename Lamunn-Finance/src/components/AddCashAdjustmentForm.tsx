"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCashAdjustmentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"OUT" | "IN">("OUT");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const signedAmount = type === "OUT" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    await fetch("/api/cash-adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, amount: signedAmount, label, note }),
    });
    setSaving(false);
    setAmount("");
    setLabel("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        + ปรับปรุงยอดเงินสด (ปันผล / แก้ไขยอด)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ประเภท</label>
        <select value={type} onChange={(e) => setType(e.target.value as "OUT" | "IN")} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
          <option value="OUT">จ่ายออก (ปันผล ฯลฯ)</option>
          <option value="IN">เพิ่มยอด (แก้ไข/พบเงินเกิน)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">วันที่</label>
        <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">จำนวนเงิน (บาท)</label>
        <input required type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-36 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">รายการ</label>
        <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น ปันผลกรรมการ ก.ค. 2569" className="w-64 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
        ยกเลิก
      </button>
    </form>
  );
}
