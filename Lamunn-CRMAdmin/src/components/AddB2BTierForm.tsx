"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";

export default function AddB2BTierForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [benefit, setBenefit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/b2b/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, minSpend, discountPercent, benefit: benefit || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มระดับไม่สำเร็จ");
      return;
    }
    setName("");
    setMinSpend("");
    setDiscountPercent("");
    setBenefit("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Layers size={18} className="text-stone-500" />
        เพิ่มระดับ B2B/Catering ใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <input required placeholder="ชื่อระดับ เช่น เทียร์ A" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input
          required
          type="number"
          min="0"
          placeholder="ยอดซื้อสะสมขั้นต่ำ (บาท)"
          value={minSpend}
          onChange={(e) => setMinSpend(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="number"
          min="0"
          max="100"
          placeholder="ส่วนลด %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        placeholder="สิทธิประโยชน์อื่นๆ (ไม่บังคับ) เช่น จัดส่งฟรี, ดูแลลูกค้าลำดับแรก"
        value={benefit}
        onChange={(e) => setBenefit(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div>
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังเพิ่ม..." : "เพิ่มระดับ"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
