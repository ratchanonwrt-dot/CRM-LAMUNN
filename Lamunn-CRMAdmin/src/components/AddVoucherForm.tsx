"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ticket } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function AddVoucherForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountMaxAmount, setDiscountMaxAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [minSpendAmount, setMinSpendAmount] = useState("");
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
        discountAmount: discountAmount || undefined,
        minSpendAmount: minSpendAmount || undefined,
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
    setDiscountAmount("");
    setMinSpendAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Ticket size={18} className="text-brand-600" />
        เพิ่มวอเชอร์ใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="ชื่อวอเชอร์">
          <input required placeholder="เช่น ส่วนลด 20 บาท" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </Field>
        <Field label="รายละเอียด (ไม่บังคับ)">
          <input placeholder="รายละเอียดเพิ่มเติม" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </Field>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-600">แบบที่ 1 — ลดเป็นเปอร์เซ็นต์</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ลดกี่ % ของยอดซื้อ">
            <input
              type="number"
              min="1"
              max="100"
              placeholder="เช่น 20 = ลด 20%"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="ลดสูงสุดไม่เกินกี่บาท (ไม่บังคับ)">
            <input
              type="number"
              min="0"
              placeholder="เช่น 100 = ลดสูงสุด 100 บาท"
              value={discountMaxAmount}
              onChange={(e) => setDiscountMaxAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-2 text-xs font-semibold text-gray-600">แบบที่ 2 — ลดเป็นจำนวนเงินคงที่ (เลือกใช้แบบใดแบบหนึ่งกับแบบที่ 1 ด้านบน ไม่ต้องกรอกทั้งคู่)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ลดกี่บาท">
            <input
              type="number"
              min="0"
              placeholder="เช่น 20 = ลด 20 บาท"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
          <Field label="ต้องซื้อครบกี่บาทถึงใช้คูปองนี้ได้ (ยอดซื้อขั้นต่ำ)">
            <input
              type="number"
              min="0"
              placeholder="เช่น 200 = ซื้อครบ 200 บาท"
              value={minSpendAmount}
              onChange={(e) => setMinSpendAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </div>

      <div className="md:w-1/4">
        <Field label="จำนวนคงเหลือ (ว่าง = ไม่จำกัด)">
          <input
            type="number"
            min="0"
            placeholder="ไม่บังคับ"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </Field>
      </div>
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
