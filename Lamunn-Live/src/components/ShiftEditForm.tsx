"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

interface ShiftData {
  id: string;
  date: string;
  streamerId: string;
  channelId: string | null;
  startTime: string;
  endTime: string;
  note: string | null;
}

export default function ShiftEditForm({ shift, streamers, channels }: { shift: ShiftData; streamers: { id: string; name: string }[]; channels: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(shift.date);
  const [streamerId, setStreamerId] = useState(shift.streamerId);
  const [channelId, setChannelId] = useState(shift.channelId ?? "");
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [note, setNote] = useState(shift.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/shifts/${shift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, streamerId, channelId: channelId || null, startTime, endTime, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-gray-400 hover:text-brand-600">
        แก้ไขกะ (วันที่ / คนไลฟ์ / เวลา / ช่องทาง)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">แก้ไขกะ</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">คนไลฟ์</label>
          <select value={streamerId} onChange={(e) => setStreamerId(e.target.value)} className={inputCls}>
            {streamers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">เริ่ม</label>
          <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ถึง</label>
          <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ช่องทาง</label>
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className={inputCls}>
            <option value="">ไม่ระบุ</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-emerald-600">บันทึกแล้ว</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
          ปิด
        </button>
      </div>
    </form>
  );
}
