"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

export default function ImageUploadField({
  value,
  onChange,
  className,
  aspectHint,
  previewAspectClass = "h-16 w-16",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  /** Recommended image ratio shown as helper text, e.g. "16:9" — purely informational, doesn't crop the file. */
  aspectHint?: string;
  /** Tailwind size/aspect classes for the preview box — defaults to a 64x64 square. Pass e.g. "h-16 w-28 aspect-video" to preview at the recommended ratio instead. */
  previewAspectClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      // A non-JSON response (platform error page, truncated body, etc.) must not
      // leave the button stuck on "กำลังอัปโหลด..." forever with no feedback.
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      onChange(data.url);
    } catch {
      setError("อัปโหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {value ? (
          <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-gray-200 shadow-sm ${previewAspectClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="ลบรูปภาพ"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className={`flex shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 text-brand-300 ${previewAspectClass}`}>
            <ImagePlus size={22} strokeWidth={2.2} />
          </div>
        )}

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {uploading ? "กำลังอัปโหลด..." : value ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
      </div>
      {aspectHint && <p className="mt-1 text-xs text-gray-400">แนะนำอัตราส่วนภาพ {aspectHint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
