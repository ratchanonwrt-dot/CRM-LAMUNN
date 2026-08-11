"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

export default function AddRewardForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("100");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, pointsCost, stock: stock || undefined, imageUrl: imageUrl || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มรางวัลไม่สำเร็จ");
      return;
    }
    setName("");
    setDescription("");
    setStock("");
    setImageUrl(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Gift size={18} className="text-brand-600" />
        เพิ่มรางวัลใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input required placeholder="ชื่อรางวัล" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required type="number" min="1" placeholder="แต้มที่ใช้แลก" value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="number" min="0" placeholder="จำนวนคงเหลือ (ว่าง = ไม่จำกัด)" value={stock} onChange={(e) => setStock(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <ImageUploadField value={imageUrl} onChange={setImageUrl} />
      <div>
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังเพิ่ม..." : "เพิ่มรางวัล"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
