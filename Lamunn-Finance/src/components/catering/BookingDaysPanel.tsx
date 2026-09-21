"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatThaiDate } from "@/lib/format";
import { useCanEdit } from "@/lib/RoleContext";

interface BookingDay {
  id: string;
  date: string; // ISO
  servings: number | null;
  note: string | null;
}

function DayRow({ bookingId, day }: { bookingId: string; day: BookingDay }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [servings, setServings] = useState(day.servings != null ? String(day.servings) : "");
  const [note, setNote] = useState(day.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/catering/bookings/${bookingId}/days/${day.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
      <span className="w-40 shrink-0 text-sm font-medium text-gray-800">{formatThaiDate(new Date(day.date))}</span>
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-gray-500">จำนวนเสิร์ฟ</label>
        <input
          type="number"
          min="0"
          disabled={!canEdit}
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          onBlur={() => {
            const prev = day.servings != null ? String(day.servings) : "";
            if (servings !== prev) save({ servings: servings || null });
          }}
          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      <input
        disabled={!canEdit}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => {
          if (note !== (day.note ?? "")) save({ note });
        }}
        placeholder="โน้ตเฉพาะวันนี้ เช่น เพิ่มรสชาติใหม่"
        className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {saving && <span className="shrink-0 text-xs text-amber-500">กำลังบันทึก...</span>}
      {saved && !saving && <span className="shrink-0 text-xs text-emerald-500">บันทึกแล้ว</span>}
    </div>
  );
}

export default function BookingDaysPanel({ bookingId, days }: { bookingId: string; days: BookingDay[] }) {
  if (days.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-gray-700">รายละเอียดแต่ละวัน (งานหลายวัน)</h2>
      <p className="mb-4 text-xs text-gray-400">งานนี้จัดต่อกัน {days.length} วัน — กรอกจำนวนเสิร์ฟและโน้ตแยกแต่ละวันได้ เช่น เพิ่มรสชาติใหม่เฉพาะบางวัน</p>
      <div className="flex flex-col gap-2">
        {days.map((d) => (
          <DayRow key={d.id} bookingId={bookingId} day={d} />
        ))}
      </div>
    </div>
  );
}
