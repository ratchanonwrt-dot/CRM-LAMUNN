"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Pencil } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";
import ImageUploadField from "@/components/ImageUploadField";
import TierVoucherTemplateManager from "@/components/TierVoucherTemplateManager";

interface VoucherOption {
  id: string;
  name: string;
  discountPercent: number | null;
  discountMaxAmount: number | null;
  discountAmount: number | null;
  minSpendAmount: number | null;
}

interface Tier {
  id: string;
  name: string;
  minPoints: number;
  benefit: string | null;
  imageUrl: string | null;
  maintenanceSpendThreshold: number | null;
  voucherTemplates: { id: string; quantity: number; reward: VoucherOption }[];
}

export default function TierRow({ tier, availableVouchers }: { tier: Tier; availableVouchers: VoucherOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tier.name);
  const [minPoints, setMinPoints] = useState(String(tier.minPoints));
  const [benefit, setBenefit] = useState(tier.benefit ?? "");
  const [maintenanceSpendThreshold, setMaintenanceSpendThreshold] = useState(
    tier.maintenanceSpendThreshold === null ? "" : String(tier.maintenanceSpendThreshold)
  );
  const [imageUrl, setImageUrl] = useState<string | null>(tier.imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/tiers/${tier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        minPoints,
        benefit: benefit || null,
        imageUrl,
        maintenanceSpendThreshold: maintenanceSpendThreshold === "" ? null : maintenanceSpendThreshold,
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
  // rest of the form's "บันทึก" button — previously the upload only updated
  // local state, so closing the row (or navigating away) without remembering
  // to click Save silently discarded the new image.
  async function handleImageChange(nextUrl: string | null) {
    setImageUrl(nextUrl);
    setImageSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/tiers/${tier.id}`, {
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
          {tier.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tier.imageUrl} alt={tier.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-400">
              <Award size={18} strokeWidth={2.2} />
            </div>
          )}
        </td>
        <td className="px-4 py-2 font-medium text-gray-800">{tier.name}</td>
        <td className="px-4 py-2 text-gray-500">{tier.minPoints} แต้มขึ้นไป</td>
        <td className="px-4 py-2 text-gray-500">{tier.benefit || "-"}</td>
        <td className="px-4 py-2 text-gray-500">
          {tier.maintenanceSpendThreshold !== null ? `${tier.maintenanceSpendThreshold.toLocaleString("th-TH")} บ. / 6 ด.` : "-"}
        </td>
        <td className="px-4 py-2">
          <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            <Pencil size={12} />
            {editing ? "ยกเลิก" : "แก้ไข"}
          </button>
        </td>
        <td className="px-4 py-2">
          <DeleteButton endpoint={`/api/admin/tiers/${tier.id}`} confirmMessage={`ลบระดับ "${tier.name}" ใช่ไหม?`} />
        </td>
      </tr>
      <tr className="border-t border-gray-100 bg-gray-50/50">
        <td colSpan={7} className="px-4 py-2">
          <TierVoucherTemplateManager tierId={tier.id} templates={tier.voucherTemplates} availableVouchers={availableVouchers} />
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={7} className="px-4 py-3">
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <input required placeholder="ชื่อระดับ" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0" placeholder="แต้มขั้นต่ำ" value={minPoints} onChange={(e) => setMinPoints(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="สิทธิประโยชน์ (Benefit)" value={benefit} onChange={(e) => setBenefit(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  placeholder="ยอดซื้อสะสมที่ต้องรักษาไว้ทุก 6 เดือน (ว่าง = ไม่มีเกณฑ์)"
                  value={maintenanceSpendThreshold}
                  onChange={(e) => setMaintenanceSpendThreshold(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:w-1/2"
                />
              </div>
              <div>
                <ImageUploadField
                  value={imageUrl}
                  onChange={handleImageChange}
                  onUploadingChange={setImageUploading}
                  aspectHint="16:9"
                  previewAspectClass="h-16 aspect-video"
                />
                {imageSaving && <p className="mt-1 text-xs text-gray-400">กำลังบันทึกรูป...</p>}
              </div>
              <div>
                {/* Disabled while a file is mid-upload/mid-save so a click here can't submit a
                    stale imageUrl and wipe out the image or other fields — this is exactly what
                    silently happened before: clicking Save while the upload was still in flight. */}
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
