"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Ticket, Pencil } from "lucide-react";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import DeleteButton from "@/components/DeleteButton";
import ImageUploadField from "@/components/ImageUploadField";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

type AutoTrigger = "WELCOME" | "NEXT_PURCHASE" | "BIRTHDAY_MONTH";

const AUTO_TRIGGER_LABELS: Record<AutoTrigger, string> = {
  WELCOME: "🔄 แจกอัตโนมัติให้สมาชิกใหม่ทุกคนตอนสมัคร",
  NEXT_PURCHASE: "🔄 แจกอัตโนมัติหลังลูกค้าใช้คูปองต้อนรับสมาชิกใหม่",
  BIRTHDAY_MONTH: "🔄 แจกอัตโนมัติให้ลูกค้าตอนเข้าเดือนเกิด (ปีละครั้ง)",
};

interface Voucher {
  id: string;
  name: string;
  description: string | null;
  stock: number | null;
  imageUrl: string | null;
  discountPercent: number | null;
  discountMaxAmount: number | null;
  discountAmount: number | null;
  minSpendAmount: number | null;
  isActive: boolean;
  autoTrigger: AutoTrigger | null;
}

export default function VoucherCatalogRow({ voucher, autoTierNames = [] }: { voucher: Voucher; autoTierNames?: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(voucher.name);
  const [description, setDescription] = useState(voucher.description ?? "");
  const [stock, setStock] = useState(voucher.stock === null ? "" : String(voucher.stock));
  const [imageUrl, setImageUrl] = useState<string | null>(voucher.imageUrl);
  const [discountPercent, setDiscountPercent] = useState(voucher.discountPercent === null ? "" : String(voucher.discountPercent));
  const [discountMaxAmount, setDiscountMaxAmount] = useState(voucher.discountMaxAmount === null ? "" : String(voucher.discountMaxAmount));
  const [discountAmount, setDiscountAmount] = useState(voucher.discountAmount === null ? "" : String(voucher.discountAmount));
  const [minSpendAmount, setMinSpendAmount] = useState(voucher.minSpendAmount === null ? "" : String(voucher.minSpendAmount));
  const [autoTrigger, setAutoTrigger] = useState<AutoTrigger | "">(voucher.autoTrigger ?? "");
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
        discountAmount: discountAmount === "" ? null : discountAmount,
        minSpendAmount: minSpendAmount === "" ? null : minSpendAmount,
        autoTrigger: autoTrigger === "" ? null : autoTrigger,
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
        <td className="px-4 py-2">
          {voucher.name}
          {autoTierNames.length > 0 && (
            <p className="mt-0.5 text-xs font-normal text-brand-600">🔄 แจกอัตโนมัติทุก 3 เดือนให้ระดับ: {autoTierNames.join(", ")}</p>
          )}
          {voucher.autoTrigger && <p className="mt-0.5 text-xs font-normal text-brand-600">{AUTO_TRIGGER_LABELS[voucher.autoTrigger]}</p>}
        </td>
        <td className="px-4 py-2 text-gray-500">
          {voucher.discountPercent !== null
            ? `ลด ${voucher.discountPercent}%${voucher.discountMaxAmount ? ` สูงสุด ${voucher.discountMaxAmount.toLocaleString("th-TH")} บ.` : ""}`
            : voucher.discountAmount !== null
              ? `ลด ${voucher.discountAmount.toLocaleString("th-TH")} บ.${voucher.minSpendAmount ? ` (ซื้อครบ ${voucher.minSpendAmount.toLocaleString("th-TH")} บ.)` : ""}`
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

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                <Field label="ตั้งเป็นคูปองอัตโนมัติ (ไม่บังคับ)">
                  <select
                    value={autoTrigger}
                    onChange={(e) => setAutoTrigger(e.target.value as AutoTrigger | "")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">ไม่ตั้ง — แจกด้วยมือเท่านั้น</option>
                    <option value="WELCOME">ต้อนรับสมาชิกใหม่ (ตอนสมัคร)</option>
                    <option value="NEXT_PURCHASE">ซื้อครั้งถัดไป (หลังใช้คูปองต้อนรับ)</option>
                    <option value="BIRTHDAY_MONTH">เดือนเกิด (ปีละครั้ง)</option>
                  </select>
                </Field>
              </div>
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
