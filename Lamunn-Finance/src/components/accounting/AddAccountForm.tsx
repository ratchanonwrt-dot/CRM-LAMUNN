"use client";

import { useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import { Plus } from "lucide-react";

const TYPES = [
  { value: "ASSET", label: "1 สินทรัพย์" },
  { value: "LIABILITY", label: "2 หนี้สิน" },
  { value: "EQUITY", label: "3 ส่วนของผู้ถือหุ้น" },
  { value: "REVENUE", label: "4 รายได้" },
  { value: "EXPENSE", label: "5 ต้นทุนและค่าใช้จ่าย" },
];

export default function AddAccountForm({ groups }: { groups: { code: string; nameTh: string }[] }) {
  const { refresh, refreshing } = useServerRefresh();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", nameTh: "", type: "EXPENSE", parentCode: "", isPostable: true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/accounting/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setForm({ code: "", nameTh: "", type: "EXPENSE", parentCode: "", isPostable: true });
    setOpen(false);
    refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        <Plus size={15} /> เพิ่มบัญชี
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-gray-800">เพิ่มบัญชีใหม่</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-gray-500">
          รหัสบัญชี
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="5495"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <label className="text-xs text-gray-500">
          ชื่อบัญชี
          <input
            required
            value={form.nameTh}
            onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
            placeholder="ค่าใช้จ่ายอื่น"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          />
        </label>
        <label className="text-xs text-gray-500">
          หมวด
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-500">
          อยู่ในกลุ่มของงบ
          <select
            value={form.parentCode}
            onChange={(e) => setForm({ ...form, parentCode: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
          >
            <option value="">— จัดตามหมวดอัตโนมัติ —</option>
            {groups.map((g) => (
              <option key={g.code} value={g.code}>
                {g.code} {g.nameTh}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
