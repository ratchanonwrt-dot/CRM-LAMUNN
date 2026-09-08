"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

export default function NewSessionForm({ channels, defaultDate }: { channels: { id: string; name: string }[]; defaultDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDate);
  const [channelId, setChannelId] = useState(channels[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, channelId: channelId || null, title, startTime, endTime, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "สร้างรอบไม่สำเร็จ");
      return;
    }
    const body = await res.json();
    router.push(`/sessions/${body.session.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">วันที่ไลฟ์</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
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
          <label className="mb-1 block text-xs font-medium text-gray-500">เวลาเริ่มไลฟ์ (ประมาณ)</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">เวลาจบไลฟ์ (เติมทีหลังได้)</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อรอบ / แคมเปญ (ถ้ามี)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น 9.9 Mega Sale, ไลฟ์ประจำวัน" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">หมายเหตุ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="เช่น มีโปรพิเศษ, เน็ตหลุดช่วง 20:00" className={inputCls} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังสร้าง..." : "สร้างรอบ แล้วไปบันทึกยอด →"}
      </button>
    </form>
  );
}
