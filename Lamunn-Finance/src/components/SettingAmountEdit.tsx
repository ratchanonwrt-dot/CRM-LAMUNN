"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBaht } from "@/lib/format";

/** ช่องแก้ตัวเลขแบบกดแล้วพิมพ์ทับ — บันทึกแบบ optimistic:
 * กด "บันทึก" แล้วตัวเลขเปลี่ยนทันที (ผ่าน onCommit → context ของหน้า) ปิดช่องพิมพ์ทันที
 * แล้วค่อยยิงบันทึกไปเซิร์ฟเวอร์เบื้องหลัง — ถ้าล้มเหลวจะย้อนค่ากลับพร้อมข้อความแดง */
export default function SettingAmountEdit({
  value,
  onCommit,
  endpoint,
}: {
  value: number;
  onCommit: (v: number) => void;
  endpoint: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toString());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const next = Number(draft);
    if (!Number.isFinite(next)) {
      setError("ตัวเลขไม่ถูกต้อง");
      return;
    }
    const previous = value;
    onCommit(next); // เห็นผลทันที
    setEditing(false);
    setError(null);
    setPending(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: draft }),
      });
      if (!res.ok) throw new Error(String(res.status));
      startTransition(() => router.refresh());
    } catch {
      onCommit(previous);
      setDraft(previous.toString());
      setError("บันทึกไม่สำเร็จ ค่าถูกย้อนกลับ — ลองใหม่อีกครั้ง");
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <div>
        <button
          onClick={() => {
            setDraft(value.toString());
            setEditing(true);
          }}
          className="mt-1 text-2xl font-bold text-brand-700 hover:underline"
        >
          {formatBaht(value)} บาท
        </button>
        {pending && <p className="text-[11px] text-amber-600">กำลังบันทึก...</p>}
        {error && <p className="text-[11px] text-rose-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-lg font-bold outline-none focus:border-brand-400 focus:bg-white"
      />
      <button onClick={handleSave} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
        บันทึก
      </button>
      <button onClick={() => setEditing(false)} className="text-sm text-gray-400">
        ยกเลิก
      </button>
    </div>
  );
}
