"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Pencil } from "lucide-react";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import DeleteButton from "@/components/DeleteButton";
import ImageUploadField from "@/components/ImageUploadField";

interface Voucher {
  id: string;
  name: string;
  description: string | null;
  stock: number | null;
  imageUrl: string | null;
  discountPercent: number | null;
  discountMaxAmount: number | null;
  isActive: boolean;
}

export default function VoucherCatalogRow({ voucher }: { voucher: Voucher }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(voucher.name);
  const [description, setDescription] = useState(voucher.description ?? "");
  const [stock, setStock] = useState(voucher.stock === null ? "" : String(voucher.stock));
  const [imageUrl, setImageUrl] = useState<string | null>(voucher.imageUrl);
  const [discountPercent, setDiscountPercent] = useState(voucher.discountPercent === null ? "" : String(voucher.discountPercent));
  const [discountMaxAmount, setDiscountMaxAmount] = useState(voucher.discountMaxAmount === null ? "" : String(voucher.discountMaxAmount));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || null,
        stock: stock === "" ? null : stock,
        imageUrl,
        discountPercent: discountPercent === "" ? null : discountPercent,
        discountMaxAmount: discountMaxAmount === "" ? null : discountMaxAmount,
      }),
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

  // Saves the image the moment a file finishes uploading, independent of the
  // rest of the form's "บันทึก" button — otherwise an upload could look
  // successful but silently not persist if the admin never clicked Save.
  async function handleImageChange(nextUrl: string | null) {
    setImageUrl(nextUrl);
    setImageSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: nextUrl }),
    });
    const data = await res.json();
    setImageSaving(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกรูปไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">
          {voucher.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={voucher.imageUrl} alt={voucher.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
              <Ticket size={18} strokeWidth={2.2} />
            </div>
          )}
        </td>
        <td className="px-4 py-2">{voucher.name}</td>
        <td className="px-4 py-2 text-gray-500">
          {voucher.discountPercent !== null
            ? `ลด ${voucher.discountPercent}%${voucher.discountMaxAmount ? ` สูงสุด ${voucher.discountMaxAmount.toLocaleString("th-TH")} บ.` : ""}`
            : "-"}
        </td>
        <td className="px-4 py-2 text-gray-500">{voucher.stock === null ? "ไม่จำกัด" : voucher.stock}</td>
        <td className="px-4 py-2">
          <ToggleActiveButton endpoint={`/api/admin/vouchers/${voucher.id}`} isActive={voucher.isActive} />
        </td>
        <td className="px-4 py-2">
          <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            <Pencil size={12} />
            {editing ? "ยกเลิก" : "แก้ไข"}
          </button>
        </td>
        <td className="px-4 py-2">
          <DeleteButton endpoint={`/api/admin/vouchers/${voucher.id}`} confirmMessage={`ลบวอเชอร์ "${voucher.name}" ใช่ไหม?`} />
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <form onSubmit={handleSave} className="flex flex-col gap-3">
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
              <div>
                <ImageUploadField
                  value={imageUrl}
                  onChange={handleImageChange}
                  onUploadingChange={setImageUploading}
                  aspectHint="5:3"
                  previewAspectClass="h-16 aspect-[5/3]"
                />
                {imageSaving && <p className="mt-1 text-xs text-gray-400">กำลังบันทึกรูป...</p>}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading || imageUploading || imageSaving}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "กำลังบันทึก..." : imageUploading ? "กำลังอัปโหลดรูป..." : "บันทึก"}
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
