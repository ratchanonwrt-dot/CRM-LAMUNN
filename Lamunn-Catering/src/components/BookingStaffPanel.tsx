"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StaffOption {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  roleLabel: string;
  staff: { id: string; name: string };
}

export default function BookingStaffPanel({
  bookingId,
  assignments,
  staffOptions,
}: {
  bookingId: string;
  assignments: Assignment[];
  staffOptions: StaffOption[];
}) {
  const router = useRouter();
  const [staffId, setStaffId] = useState("");
  const [roleLabel, setRoleLabel] = useState("ทีมงาน");
  const [saving, setSaving] = useState(false);

  const assignedIds = new Set(assignments.map((a) => a.staff.id));
  const available = staffOptions.filter((s) => !assignedIds.has(s.id));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) return;
    setSaving(true);
    await fetch(`/api/bookings/${bookingId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, roleLabel }),
    });
    setSaving(false);
    setStaffId("");
    router.refresh();
  }

  async function handleRemove(assignmentId: string) {
    await fetch(`/api/bookings/${bookingId}/staff/${assignmentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">ทีมงานที่ไปดูแลงาน</h2>

      <div className="mb-4 flex flex-col gap-2">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium text-gray-800">{a.staff.name}</span>
            <span className="text-gray-500">{a.roleLabel}</span>
            <button onClick={() => handleRemove(a.id)} className="text-xs text-red-500 hover:underline">
              เอาออก
            </button>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-gray-400">ยังไม่ได้จัดคน</p>}
      </div>

      {available.length > 0 && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">พนักงาน</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="">เลือกพนักงาน</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">บทบาทในงาน</label>
            <select value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white">
              <option value="หัวหน้างาน">หัวหน้างาน</option>
              <option value="ทีมงาน">ทีมงาน</option>
              <option value="คนขับ">คนขับ</option>
            </select>
          </div>
          <button type="submit" disabled={saving || !staffId} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            + เพิ่ม
          </button>
        </form>
      )}
    </div>
  );
}
