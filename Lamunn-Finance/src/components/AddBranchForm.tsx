"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBranchForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "CREDIT_TERM">("CASH");
  const [sortOrder, setSortOrder] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, type, sortOrder: sortOrder ? Number(sortOrder) : undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "เพิ่มสาขาไม่สำเร็จ");
      return;
    }
    setCode("");
    setName("");
    setSortOrder("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
      >
        + เพิ่มสาขาใหม่
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">รหัส</label>
        <input required value={code} onChange={(e) => setCode(e.target.value)} className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อสาขา</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ประเภท</label>
        <select value={type} onChange={(e) => setType(e.target.value as "CASH" | "CREDIT_TERM")} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
          <option value="CASH">เงินสด</option>
          <option value="CREDIT_TERM">Credit Term</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ลำดับ</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังบันทึก..." : "เพิ่มสาขา"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
        ยกเลิก
      </button>
    </form>
  );
}
