"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TimeSelect from "@/components/TimeSelect";

const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

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
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white shadow-card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">วันที่ไลฟ์</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ช่องทาง</label>
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
          <label className="mb-1 block text-xs font-medium text-muted">เวลาเริ่มไลฟ์ (ประมาณ)</label>
          <TimeSelect value={startTime} onChange={(v) => setStartTime(v)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">เวลาจบไลฟ์ (เติมทีหลังได้)</label>
          <TimeSelect value={endTime} onChange={(v) => setEndTime(v)} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">ชื่อรอบ / แคมเปญ (ถ้ามี)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น 9.9 Mega Sale, ไลฟ์ประจำวัน" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">หมายเหตุ</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="เช่น มีโปรพิเศษ, เน็ตหลุดช่วง 20:00" className={inputCls} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="mt-4 rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50">
        {saving ? "กำลังสร้าง..." : "สร้างรอบ แล้วไปบันทึกยอด →"}
      </button>
    </form>
  );
}
