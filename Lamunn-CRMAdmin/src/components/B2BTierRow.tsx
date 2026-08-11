"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Pencil } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";

interface B2BTier {
  id: string;
  name: string;
  minSpend: number;
  discountPercent: number;
}

export default function B2BTierRow({ tier }: { tier: B2BTier }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tier.name);
  const [minSpend, setMinSpend] = useState(String(tier.minSpend));
  const [discountPercent, setDiscountPercent] = useState(String(tier.discountPercent));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/b2b/tiers/${tier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, minSpend, discountPercent }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
            <Layers size={18} strokeWidth={2.2} />
          </div>
        </td>
        <td className="px-4 py-2 font-medium text-gray-800">{tier.name}</td>
        <td className="px-4 py-2 text-gray-500">{tier.minSpend.toLocaleString()} บาทขึ้นไป</td>
        <td className="px-4 py-2 text-gray-500">ลด {tier.discountPercent}%</td>
        <td className="px-4 py-2">
          <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            <Pencil size={12} />
            {editing ? "ยกเลิก" : "แก้ไข"}
          </button>
        </td>
        <td className="px-4 py-2">
          <DeleteButton endpoint={`/api/admin/b2b/tiers/${tier.id}`} confirmMessage={`ลบระดับ "${tier.name}" ใช่ไหม?`} />
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <input required placeholder="ชื่อระดับ" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0" placeholder="ยอดซื้อสะสมขั้นต่ำ (บาท)" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0" max="100" placeholder="ส่วนลด %" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
