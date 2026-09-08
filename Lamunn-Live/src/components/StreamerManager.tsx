"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StreamerRow {
  id: string;
  name: string;
  nickname: string | null;
  note: string | null;
  hrEmployeeId: string | null;
  sortOrder: number;
  isActive: boolean;
  slotCount: number;
}

const inputCls = "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

function Row({ s, onChanged }: { s: StreamerRow; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [nickname, setNickname] = useState(s.nickname ?? "");
  const [note, setNote] = useState(s.note ?? "");
  const [hrEmployeeId, setHrEmployeeId] = useState(s.hrEmployeeId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/streamers/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setBusy(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ");
      return false;
    }
    onChanged();
    return true;
  }

  async function remove() {
    if (!confirm(`ลบ "${s.name}" ?`)) return;
    setBusy(true);
    const res = await fetch(`/api/streamers/${s.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "ลบไม่สำเร็จ");
      return;
    }
    onChanged();
  }

  if (editing) {
    return (
      <tr className="border-t border-gray-100 bg-brand-50/40">
        <td className="px-3 py-2" colSpan={2}>
          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " max-w-[180px]"} placeholder="ชื่อ" />
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls + " max-w-[140px]"} placeholder="ชื่อเล่น" />
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " max-w-[220px]"} placeholder="หมายเหตุ" />
            <input value={hrEmployeeId} onChange={(e) => setHrEmployeeId(e.target.value)} className={inputCls + " max-w-[150px]"} placeholder="รหัสพนักงาน HR" />
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
        <td className="px-3 py-2 text-right text-gray-500">{s.slotCount}</td>
        <td className="px-3 py-2" colSpan={2}>
          <div className="flex gap-2">
            <button
              disabled={busy || !name.trim()}
              onClick={async () => {
                if (await patch({ name, nickname, note, hrEmployeeId })) setEditing(false);
              }}
              className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              บันทึก
            </button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500">
              ยกเลิก
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 font-medium text-gray-800">
        {s.name}
        {s.nickname && <span className="ml-1.5 text-xs font-normal text-gray-400">({s.nickname})</span>}
        {s.hrEmployeeId && <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">HR: {s.hrEmployeeId}</span>}
        {error && <p className="text-xs font-normal text-red-600">{error}</p>}
      </td>
      <td className="px-3 py-2 text-gray-500">{s.note ?? ""}</td>
      <td className="px-3 py-2 text-right text-gray-500">{s.slotCount}</td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={() => patch({ isActive: !s.isActive })}
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
        >
          {s.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="font-medium text-brand-600 hover:underline">
            แก้ไข
          </button>
          {s.slotCount === 0 && (
            <button onClick={remove} disabled={busy} className="text-gray-400 hover:text-red-600">
              ลบ
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function StreamerManager({ streamers }: { streamers: StreamerRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/streamers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, nickname }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    setName("");
    setNickname("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อคนไลฟ์</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " w-56"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อเล่น (ถ้ามี)</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls + " w-40"} />
        </div>
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "กำลังเพิ่ม..." : "+ เพิ่มคนไลฟ์"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">ชื่อ</th>
              <th className="px-3 py-2">หมายเหตุ</th>
              <th className="px-3 py-2 text-right">ช่วงที่บันทึก</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {streamers.map((s) => (
              <Row key={s.id} s={s} onChanged={() => router.refresh()} />
            ))}
            {streamers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีคนไลฟ์ — เพิ่มชื่อด้านบนก่อน แล้วค่อยไปบันทึกรอบไลฟ์
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
