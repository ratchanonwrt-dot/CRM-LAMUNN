"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChannelRow {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  publicBooking: boolean;
  sessionCount: number;
}

const inputCls = "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white";

function Row({ c, onChanged }: { c: ChannelRow; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/channels/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setBusy(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ");
      return false;
    }
    onChanged();
    return true;
  }

  async function remove() {
    if (!confirm(`ลบ "${c.name}" ?`)) return;
    setBusy(true);
    const res = await fetch(`/api/channels/${c.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "ลบไม่สำเร็จ");
      return;
    }
    onChanged();
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-3 py-2 font-medium text-gray-800">
        {editing ? (
          <div className="flex items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " w-48"} />
            <button
              disabled={busy || !name.trim()}
              onClick={async () => {
                if (await patch({ name })) setEditing(false);
              }}
              className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              บันทึก
            </button>
            <button onClick={() => setEditing(false)} className="text-xs text-gray-400">
              ยกเลิก
            </button>
          </div>
        ) : (
          c.name
        )}
        {error && <p className="text-xs font-normal text-red-600">{error}</p>}
      </td>
      <td className="px-3 py-2 text-right text-gray-500">{c.sessionCount}</td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={() => patch({ isActive: !c.isActive })}
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
        >
          {c.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </button>
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy || !c.isActive}
          onClick={() => patch({ publicBooking: !c.publicBooking })}
          title={c.isActive ? "เปิด/ปิดให้คนภายนอกขอจองช่องนี้ผ่านเว็บจอง" : "ต้องเปิดใช้งานช่องก่อน"}
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${c.publicBooking ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}
        >
          {c.publicBooking ? "เปิดรับจอง" : "ปิดรับจอง"}
        </button>
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-3 text-xs">
          {!editing && (
            <button onClick={() => setEditing(true)} className="font-medium text-brand-600 hover:underline">
              แก้ไข
            </button>
          )}
          {c.sessionCount === 0 && (
            <button onClick={remove} disabled={busy} className="text-gray-400 hover:text-red-600">
              ลบ
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function ChannelManager({ channels }: { channels: ChannelRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อช่องทาง (เช่น TikTok, Facebook, Shopee Live)</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " w-64"} />
        </div>
        <button type="submit" disabled={saving} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {saving ? "กำลังเพิ่ม..." : "+ เพิ่มช่องทาง"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">ช่องทาง</th>
              <th className="px-3 py-2 text-right">รอบไลฟ์</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">เว็บจอง</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <Row key={c.id} c={c} onChanged={() => router.refresh()} />
            ))}
            {channels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีช่องทาง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
