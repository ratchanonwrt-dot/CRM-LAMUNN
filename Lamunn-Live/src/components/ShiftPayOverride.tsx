"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";
import { formatBaht } from "@/lib/format";

const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

/** แอดมินใส่ยอดจ่ายรวมของกะเองทับที่ระบบคำนวณ + หมายเหตุ (ไม่บังคับ) */
export default function ShiftPayOverride({ shiftId, computed, override, note: initialNote }: { shiftId: string; computed: number; override: number | null; note: string | null }) {
  const router = useRouter();
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(override === null ? "" : String(override));
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(reset = false) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/shifts/${shiftId}/pay`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: reset ? null : amount.trim() === "" ? null : amount, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    if (reset) setAmount("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-muted">
          {override !== null ? (
            <span>
              <span className="mr-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">แอดมินกำหนดเอง</span>
              จ่าย {formatBaht(override)} ฿ (ระบบคำนวณได้ {formatBaht(computed)} ฿)
            </span>
          ) : (
            <span>ยอดจ่ายตามที่ระบบคำนวณ</span>
          )}
          {initialNote && <p className="mt-1 text-[12px] text-ink/80">📝 {initialNote}</p>}
        </div>
        {canEdit && !open && (
          <button onClick={() => setOpen(true)} className="font-medium text-brand-600 hover:underline">
            {override !== null || initialNote ? "แก้ยอดจ่าย / หมายเหตุ" : "กำหนดยอดจ่ายเอง / ใส่หมายเหตุ"}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-xl bg-paper p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr]">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">ยอดจ่ายรวมทั้งกะ (บาท)</label>
              <input type="number" inputMode="decimal" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls + " tabular-nums"} placeholder={`ระบบคำนวณ ${formatBaht(computed)}`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">หมายเหตุ (ไม่บังคับ)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="เช่น ตกลงเหมา 1,500 เพราะแคมเปญพิเศษ / มีโบนัสเพิ่ม" />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-stone-400">เว้นช่องยอดว่างไว้ = ใช้ที่ระบบคำนวณ · ยอดนี้จะไปแทนที่ในหน้า &quot;ค่าคอมมิชชั่น&quot; ของสัปดาห์นั้นด้วย</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => save(false)} disabled={saving} className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            {override !== null && (
              <button onClick={() => save(true)} disabled={saving} className="rounded-xl border border-line px-4 py-2 text-sm text-muted hover:bg-white disabled:opacity-50">
                กลับไปใช้ที่ระบบคำนวณ
              </button>
            )}
            <button onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm text-stone-400 hover:text-muted">
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
