"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

interface Tier {
  id: string;
  name: string;
  imageUrl: string | null;
}

export default function TierImagesSettingsForm({ tiers }: { tiers: Tier[] }) {
  const router = useRouter();
  const [images, setImages] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(tiers.map((t) => [t.id, t.imageUrl]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave(tierId: string, nextUrl: string | null) {
    setImages((v) => ({ ...v, [tierId]: nextUrl }));
    setSavingId(tierId);
    setSavedId(null);
    setError(null);
    const res = await fetch(`/api/admin/tiers/${tierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: nextUrl }),
    });
    const data = await res.json();
    setSavingId(null);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSavedId(tierId);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Award size={18} className="text-fuchsia-500" />
        รูปบัตรสมาชิกแต่ละระดับ
      </div>
      <p className="mt-1 text-xs text-gray-400">
        อัปโหลดรูปพื้นหลังบัตรสมาชิกของแต่ละระดับ — จะไปโชว์ในหน้าแรกของแอปลูกค้า (แก้ชื่อระดับ/เกณฑ์แต้ม/สิทธิประโยชน์ได้ที่เมนู &quot;ระดับสมาชิก&quot;)
      </p>
      {tiers.length === 0 ? (
        <p className="mt-3 text-xs text-gray-400">ยังไม่มีระดับสมาชิก — ไปเพิ่มที่เมนู &quot;ระดับสมาชิก&quot; ก่อน</p>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {tiers.map((tier) => (
            <div key={tier.id}>
              <p className="mb-1 text-xs font-medium text-gray-600">{tier.name}</p>
              <ImageUploadField value={images[tier.id]} onChange={(url) => handleSave(tier.id, url)} />
              {savingId === tier.id && <p className="mt-1 text-xs text-gray-400">กำลังบันทึก...</p>}
              {savedId === tier.id && <p className="mt-1 text-xs text-brand-600">บันทึกแล้ว</p>}
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
