"use client";

import { useRef, useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import { FileSpreadsheet } from "lucide-react";

interface ImportResult {
  created: number;
  updated: number;
  skippedCount: number;
  skipped: { row: number; reason: string }[];
}

/** ปุ่มนำเข้าไฟล์ Excel/CSV แบบทั่วไป — ใช้ร่วมกันทั้งนำเข้าผังบัญชีและนำเข้าคู่ค้า
 * endpoint ต้องคืน { created, updated, skippedCount, skipped } ตามรูปแบบเดียวกัน */
export default function ImportExcelButton({
  endpoint,
  label,
  createdLabel = "สร้างใหม่",
  updatedLabel = "อัพเดต",
}: {
  endpoint: string;
  label: string;
  createdLabel?: string;
  updatedLabel?: string;
}) {
  const { refresh, refreshing } = useServerRefresh();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const busy = submitting || refreshing;
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setSubmitting(true);
    setError(null);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "นำเข้าไม่สำเร็จ");
      } else {
        setResult(data);
        refresh();
      }
    } catch {
      setError("นำเข้าไม่สำเร็จ — ลองใหม่อีกครั้ง");
    }
    setSubmitting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <FileSpreadsheet size={15} />
        {busy ? "กำลังนำเข้า..." : label}
      </button>
      {result && (
        <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {createdLabel} {result.created} · {updatedLabel} {result.updated} · ข้าม {result.skippedCount} แถว
          {result.skipped.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-amber-700">
              {result.skipped.slice(0, 8).map((s) => (
                <li key={s.row}>
                  แถว {s.row}: {s.reason}
                </li>
              ))}
              {result.skippedCount > 8 && <li>...และอีก {result.skippedCount - 8} แถว</li>}
            </ul>
          )}
        </div>
      )}
      {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
}
