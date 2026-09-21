"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  staffName: string | null;
  staff: { id: string; name: string } | null;
}

export default function BookingStaffPanel({ bookingId, assignments }: { bookingId: string; assignments: Assignment[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    await fetch(`/api/catering/bookings/${bookingId}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffName: name }),
    });
    setSaving(false);
    setName("");
    router.refresh();
  }

  async function handleRemove(assignmentId: string) {
    await fetch(`/api/catering/bookings/${bookingId}/staff/${assignmentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">พนักงานที่ไปดูแลงาน</h2>

      <div className="mb-4 flex flex-col gap-2">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium text-gray-800">{a.staffName ?? a.staff?.name}</span>
            <button onClick={() => handleRemove(a.id)} className="text-xs text-red-500 hover:underline">
              เอาออก
            </button>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-gray-400">ยังไม่ได้จัดคน</p>}
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อพนักงาน</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น พี่แนน, น้องมิ้นท์"
            className="w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <button type="submit" disabled={saving || !name} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          + เพิ่ม
        </button>
      </form>
    </div>
  );
}
