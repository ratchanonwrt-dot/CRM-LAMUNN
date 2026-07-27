"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BranchOption {
  id: string;
  name: string;
}

export default function AddManualCreditTermForm({ branches }: { branches: BranchOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [label, setLabel] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/credit-term/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId: branchId || undefined, label, netAmount, dueDate, note }),
    });
    setSaving(false);
    setLabel("");
    setNetAmount("");
    setDueDate("");
    setNote("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        + เพิ่มรายการยอดยกมา / manual
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">สาขา (ไม่บังคับ)</label>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
          <option value="">— ไม่ระบุ —</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อรายการ</label>
        <input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น ยอดยกมาก่อนเริ่มระบบ" className="w-64 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ยอดรับสุทธิ (บาท)</label>
        <input required type="number" step="0.01" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">วันครบกำหนด</label>
        <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังบันทึก..." : "เพิ่มรายการ"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
        ยกเลิก
      </button>
    </form>
  );
}
