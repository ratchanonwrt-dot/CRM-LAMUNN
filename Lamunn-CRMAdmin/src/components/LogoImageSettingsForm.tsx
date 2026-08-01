"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";

export default function LogoImageSettingsForm({ initialImageUrl }: { initialImageUrl: string | null }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave(nextUrl: string | null) {
    setImageUrl(nextUrl);
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/settings/logo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoImageUrl: nextUrl }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ImageIcon size={18} className="text-brand-600" />
        โลโก้ร้าน (หน้าแรก + หน้าล็อกอินฝั่งลูกค้า)
      </div>
      <p className="mt-1 text-xs text-gray-400">
        อัปโหลดรูปโลโก้ที่จะแสดงตั้งแต่หน้าแรกที่ลูกค้าเปิดเข้ามา — ถ้าไม่อัปโหลด ระบบจะใช้โลโก้เริ่มต้นแทน
      </p>
      <div className="mt-3">
        <ImageUploadField value={imageUrl} onChange={handleSave} />
      </div>
      {saving && <p className="mt-2 text-xs text-gray-400">กำลังบันทึก...</p>}
      {saved && !saving && <p className="mt-2 text-xs text-brand-600">บันทึกแล้ว</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
