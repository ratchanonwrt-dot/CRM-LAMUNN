"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

export default function AddTierForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [minPoints, setMinPoints] = useState("");
  const [benefit, setBenefit] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, minPoints, benefit: benefit || undefined, imageUrl: imageUrl || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มระดับไม่สำเร็จ");
      return;
    }
    setName("");
    setMinPoints("");
    setBenefit("");
    setImageUrl(null);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Award size={18} className="text-amber-500" />
        เพิ่มระดับสมาชิกใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <input required placeholder="ชื่อระดับ เช่น Silver" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input required type="number" min="0" placeholder="แต้มขั้นต่ำ" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="สิทธิประโยชน์ (Benefit)" value={benefit} onChange={(e) => setBenefit(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <ImageUploadField value={imageUrl} onChange={setImageUrl} aspectHint="16:9" previewAspectClass="h-16 aspect-video" />
      <div>
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังเพิ่ม..." : "เพิ่มระดับ"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
