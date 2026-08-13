"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

export default function AddVoucherForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountMaxAmount, setDiscountMaxAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        stock: stock || undefined,
        imageUrl: imageUrl || undefined,
        discountPercent: discountPercent || undefined,
        discountMaxAmount: discountMaxAmount || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มวอเชอร์ไม่สำเร็จ");
      return;
    }
    setName("");
    setDescription("");
    setStock("");
    setImageUrl(null);
    setDiscountPercent("");
    setDiscountMaxAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Ticket size={18} className="text-brand-600" />
        เพิ่มวอเชอร์ใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input required placeholder="ชื่อวอเชอร์" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="รายละเอียด" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input
          type="number"
          min="1"
          max="100"
          placeholder="ส่วนลด %"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min="0"
          placeholder="ลดสูงสุด (บาท)"
          value={discountMaxAmount}
          onChange={(e) => setDiscountMaxAmount(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        type="number"
        min="0"
        placeholder="จำนวนคงเหลือ (ว่าง = ไม่จำกัด)"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:w-1/4"
      />
      <ImageUploadField
        value={imageUrl}
        onChange={setImageUrl}
        onUploadingChange={setImageUploading}
        aspectHint="5:3"
        previewAspectClass="h-16 aspect-[5/3]"
      />
      <div>
        <button type="submit" disabled={loading || imageUploading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังเพิ่ม..." : imageUploading ? "กำลังอัปโหลดรูป..." : "เพิ่มวอเชอร์"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
