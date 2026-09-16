"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StaffRole = "SUPER_ADMIN" | "MANAGER" | "STAFF";

const ROLE_LABEL: Record<StaffRole, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด",
  MANAGER: "ผู้จัดการ",
  STAFF: "พนักงาน",
};

interface StaffUserRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

function RoleSelect({
  value,
  disabled,
  onChange,
  detailed,
}: {
  value: StaffRole;
  disabled?: boolean;
  onChange: (role: StaffRole) => void;
  detailed?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StaffRole)}
      className="rounded-lg border border-line bg-white px-2 py-1 text-xs outline-none disabled:opacity-50"
    >
      <option value="STAFF">{detailed ? "พนักงาน (บันทึกยอดได้ ตั้งค่าไม่ได้)" : ROLE_LABEL.STAFF}</option>
      <option value="MANAGER">{detailed ? "ผู้จัดการ (แก้ไขได้ทุกอย่าง ยกเว้นจัดการผู้ใช้งาน)" : ROLE_LABEL.MANAGER}</option>
      <option value="SUPER_ADMIN">{detailed ? "ผู้ดูแลระบบสูงสุด (ทำได้ทุกอย่าง)" : ROLE_LABEL.SUPER_ADMIN}</option>
    </select>
  );
}

function AddStaffForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState<{ name: string; email: string; password: string; role: StaffRole }>({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "เพิ่มผู้ใช้งานไม่สำเร็จ");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "STAFF" });
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-line bg-white shadow-card p-5">
      <h2 className="mb-4 font-display text-[15px] font-semibold text-ink">เพิ่มผู้ใช้งานใหม่</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">ชื่อ</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">อีเมล</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">รหัสผ่านเริ่มต้น</label>
          <input
            required
            type="text"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">สิทธิ์การใช้งาน</label>
          <div className="w-full">
            <RoleSelect value={form.role} onChange={(role) => setForm((f) => ({ ...f, role }))} detailed />
          </div>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {saving ? "กำลังเพิ่ม..." : "+ เพิ่มผู้ใช้งาน"}
      </button>
    </form>
  );
}

function StaffRow({ user, currentStaffId, onChanged }: { user: StaffUserRow; currentStaffId: string; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const isSelf = user.id === currentStaffId;

  async function patch(data: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/staff/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    onChanged();
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) return;
    setBusy(true);
    await fetch(`/api/staff/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setBusy(false);
    setNewPassword("");
    setResetting(false);
    onChanged();
  }

  return (
    <tr className="border-t border-line/60">
      <td className="px-3 py-2 font-medium text-ink">
        {user.name}
        {isSelf && <span className="ml-1.5 text-xs font-normal text-stone-400">(คุณ)</span>}
      </td>
      <td className="px-3 py-2 text-muted">{user.email}</td>
      <td className="px-3 py-2">
        <RoleSelect value={user.role} disabled={busy || isSelf} onChange={(role) => patch({ role })} />
      </td>
      <td className="px-3 py-2">
        <button
          disabled={busy || isSelf}
          onClick={() => patch({ isActive: !user.isActive })}
          className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
            user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-muted"
          }`}
        >
          {user.isActive ? "ใช้งานอยู่" : "ปิดการใช้งานแล้ว"}
        </button>
      </td>
      <td className="px-3 py-2">
        {resetting ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              autoFocus
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="รหัสผ่านใหม่"
              className="w-28 rounded-lg border border-line bg-white px-2 py-1 text-xs outline-none focus:border-ink"
            />
            <button onClick={handleResetPassword} disabled={busy || newPassword.length < 6} className="text-xs font-medium text-brand-600 disabled:opacity-40">
              บันทึก
            </button>
            <button onClick={() => { setResetting(false); setNewPassword(""); }} className="text-xs text-stone-400">
              ยกเลิก
            </button>
          </div>
        ) : (
          <button onClick={() => setResetting(true)} className="text-xs font-medium text-muted hover:text-brand-600">
            ตั้งรหัสผ่านใหม่
          </button>
        )}
      </td>
    </tr>
  );
}

export default function StaffManager({ initialUsers, currentStaffId }: { initialUsers: StaffUserRow[]; currentStaffId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  async function refresh() {
    const res = await fetch("/api/staff");
    if (res.ok) {
      const body = await res.json();
      setUsers(body.users);
    }
    router.refresh();
  }

  return (
    <div>
      <AddStaffForm onAdded={refresh} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-paper/70 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="px-3 py-2">ชื่อ</th>
              <th className="px-3 py-2">อีเมล</th>
              <th className="px-3 py-2">สิทธิ์</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">รหัสผ่าน</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <StaffRow key={u.id} user={u} currentStaffId={currentStaffId} onChanged={refresh} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
