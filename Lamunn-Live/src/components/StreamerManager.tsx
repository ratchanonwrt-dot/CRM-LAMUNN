"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { STREAMER_PALETTE, streamerColor, streamerDot } from "@/lib/schedule";

interface StreamerRow {
  id: string;
  name: string;
  nickname: string | null;
  note: string | null;
  hrEmployeeId: string | null;
  phone: string | null;
  lineId: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  slotCount: number;
}

const inputCls = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function ColorPicker({ value, onChange, size = "h-6 w-6" }: { value: string | null; onChange: (k: string) => void; size?: string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {STREAMER_PALETTE.map((p) => (
        <button
          key={p.key}
          type="button"
          title={p.label}
          onClick={() => onChange(p.key)}
          className={clsx("rounded-full border-2 transition", size, p.dot, value === p.key ? "border-gray-800 scale-110" : "border-transparent hover:scale-110")}
        />
      ))}
    </div>
  );
}

function Row({ s, onChanged }: { s: StreamerRow; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.name);
  const [nickname, setNickname] = useState(s.nickname ?? "");
  const [note, setNote] = useState(s.note ?? "");
  const [hrEmployeeId, setHrEmployeeId] = useState(s.hrEmployeeId ?? "");
  const [phone, setPhone] = useState(s.phone ?? "");
  const [lineId, setLineId] = useState(s.lineId ?? "");
  const [bankName, setBankName] = useState(s.bankName ?? "");
  const [bankAccountNo, setBankAccountNo] = useState(s.bankAccountNo ?? "");
  const [bankAccountName, setBankAccountName] = useState(s.bankAccountName ?? "");
  const [color, setColor] = useState(s.color);
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
      <tr className="border-t border-line/60 bg-brand-50/40">
        <td className="px-3 py-2" colSpan={4}>
          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " max-w-[180px]"} placeholder="ชื่อ" />
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls + " max-w-[140px]"} placeholder="ชื่อเล่น" />
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls + " max-w-[220px]"} placeholder="หมายเหตุ" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls + " max-w-[150px]"} placeholder="เบอร์โทร" inputMode="tel" />
            <input value={lineId} onChange={(e) => setLineId(e.target.value)} className={inputCls + " max-w-[150px]"} placeholder="LINE ID" />
            <input value={hrEmployeeId} onChange={(e) => setHrEmployeeId(e.target.value)} className={inputCls + " max-w-[150px]"} placeholder="รหัสพนักงาน HR" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">บัญชีรับเงิน</span>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls + " max-w-[140px]"} placeholder="ธนาคาร เช่น กสิกร" />
            <input value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} className={inputCls + " max-w-[180px]"} placeholder="เลขบัญชี" inputMode="numeric" />
            <input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputCls + " max-w-[200px]"} placeholder="ชื่อบัญชี (ถ้าต่างจากชื่อ)" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted">สีในตาราง</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
        <td className="px-3 py-2 text-right text-muted">{s.slotCount}</td>
        <td className="px-3 py-2" colSpan={2}>
          <div className="flex gap-2">
            <button
              disabled={busy || !name.trim()}
              onClick={async () => {
                if (await patch({ name, nickname, note, hrEmployeeId, phone, lineId, color, bankName, bankAccountNo, bankAccountName })) setEditing(false);
              }}
              className="rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              บันทึก
            </button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-line px-3 py-1 text-xs text-muted">
              ยกเลิก
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-line/60">
      <td className="px-3 py-2 font-medium text-ink">
        <span className={clsx("mr-1.5 inline-block h-3 w-3 rounded-full align-middle", streamerDot(s.color))} />
        <span className={clsx("rounded-md border px-1.5 py-0.5", streamerColor(s.color))}>{s.name}</span>
        {s.nickname && <span className="ml-1.5 text-xs font-normal text-stone-400">({s.nickname})</span>}
        {s.hrEmployeeId && <span className="ml-1.5 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-normal text-muted">HR: {s.hrEmployeeId}</span>}
        {error && <p className="text-xs font-normal text-red-600">{error}</p>}
      </td>
      <td className="px-3 py-2 text-muted">
        {s.phone || s.lineId ? (
          <div className="text-xs leading-5">
            {s.phone && <p className="tabular-nums">📞 {s.phone}</p>}
            {s.lineId && <p>LINE: {s.lineId}</p>}
          </div>
        ) : (
          <span className="text-xs text-stone-300">ยังไม่กรอก</span>
        )}
      </td>
      <td className="px-3 py-2 text-xs">
        {s.bankAccountNo ? (
          <div className="leading-5 text-muted">
            <p className="tabular-nums text-ink">{s.bankName ? `${s.bankName} ` : ""}{s.bankAccountNo}</p>
            {s.bankAccountName && <p>{s.bankAccountName}</p>}
          </div>
        ) : (
          <span className="text-red-500">ยังไม่มีเลขบัญชี</span>
        )}
      </td>
      <td className="px-3 py-2 text-muted">{s.note ?? ""}</td>
      <td className="px-3 py-2 text-right text-muted">{s.slotCount}</td>
      <td className="px-3 py-2">
        <button
          disabled={busy}
          onClick={() => patch({ isActive: !s.isActive })}
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-muted"}`}
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
            <button onClick={remove} disabled={busy} className="text-stone-400 hover:text-red-600">
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
  const [phone, setPhone] = useState("");
  const [lineId, setLineId] = useState("");
  const [color, setColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/streamers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, nickname, phone, lineId, color }) });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    setName("");
    setNickname("");
    setPhone("");
    setLineId("");
    setColor(null);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white shadow-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ชื่อคนไลฟ์</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls + " w-56"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ชื่อเล่น (ถ้ามี)</label>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls + " w-40"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">เบอร์โทร</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls + " w-40"} inputMode="tel" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">LINE ID</label>
          <input value={lineId} onChange={(e) => setLineId(e.target.value)} className={inputCls + " w-40"} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">สีในตาราง (ไม่เลือก = ระบบเลือกสีที่ยังว่างให้)</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <button type="submit" disabled={saving} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {saving ? "กำลังเพิ่ม..." : "+ เพิ่มคนไลฟ์"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-paper/70 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">ชื่อ</th>
              <th className="px-3 py-2">ติดต่อ</th>
              <th className="px-3 py-2">บัญชีรับเงิน</th>
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
                <td colSpan={7} className="px-4 py-6 text-center text-stone-400">
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
