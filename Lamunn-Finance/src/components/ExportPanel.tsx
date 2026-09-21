"use client";

import { useState } from "react";

export interface ExportOption {
  key: string;
  label: string;
}

export default function ExportPanel({
  apiPath,
  options,
  extraParams,
}: {
  apiPath: string;
  options: ExportOption[];
  extraParams?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(options.map((o) => o.key)));
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleExport() {
    if (selected.size === 0) return;
    setLoading(true);
    const params = new URLSearchParams({ ...extraParams, sections: Array.from(selected).join(",") });
    const res = await fetch(`${apiPath}?${params.toString()}`);
    if (!res.ok) {
      setLoading(false);
      alert("Export ไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const disposition = res.headers.get("Content-Disposition");
    const utf8Match = disposition?.match(/filename\*=UTF-8''([^;]+)/);
    const plainMatch = disposition?.match(/filename="([^"]+)"/);
    const filename = utf8Match ? decodeURIComponent(utf8Match[1]) : (plainMatch?.[1] ?? "export.xlsx");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLoading(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        ⬇ Export Excel
      </button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:w-auto">
      <p className="mb-2 text-xs font-semibold text-gray-700">เลือกข้อมูลที่จะ Export</p>
      <div className="mb-3 flex flex-col gap-1.5">
        {options.map((o) => (
          <label key={o.key} className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={selected.has(o.key)} onChange={() => toggle(o.key)} className="accent-brand-600" />
            {o.label}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={loading || selected.size === 0}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "กำลังสร้างไฟล์..." : "Export"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
