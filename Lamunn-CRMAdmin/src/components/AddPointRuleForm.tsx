"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BranchOption {
  id: string;
  code: string;
  name: string;
}

export default function AddPointRuleForm({ branches, allowGlobal, fixedBranchId }: { branches: BranchOption[]; allowGlobal: boolean; fixedBranchId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [branchId, setBranchId] = useState(fixedBranchId ?? (allowGlobal ? "" : branches[0]?.id ?? ""));
  const [bahtPerPoint, setBahtPerPoint] = useState("25");
  const [minAmount, setMinAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/point-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, branchId: branchId || undefined, bahtPerPoint, minAmount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มกติกาไม่สำเร็จ");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-6">
      <input required placeholder="ชื่อกติกา" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!!fixedBranchId} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100">
        {allowGlobal && <option value="">ทุกสาขา (ค่าเริ่มต้น)</option>}
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </select>
      <input required type="number" step="0.01" min="0.01" placeholder="บาทต่อ 1 แต้ม" value={bahtPerPoint} onChange={(e) => setBahtPerPoint(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <input required type="number" step="0.01" min="0" placeholder="ยอดขั้นต่ำ (บาท)" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "กำลังเพิ่ม..." : "เพิ่มกติกา"}
      </button>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
