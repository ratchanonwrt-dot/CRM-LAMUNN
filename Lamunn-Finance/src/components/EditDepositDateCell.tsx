"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";
import { formatThaiDate } from "@/lib/format";

export default function EditDepositDateCell({ id, depositedAt }: { id: string; depositedAt: Date | null }) {
  const router = useRouter();
  const canEdit = useCanEdit("HELD_DEPOSITS");
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(depositedAt ? depositedAt.toISOString().slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/held-deposits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositedAt: date || null }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!canEdit) {
    return <span>{depositedAt ? formatThaiDate(depositedAt) : "-"}</span>;
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-brand-600 hover:underline">
        {depositedAt ? formatThaiDate(depositedAt) : "- (แก้ไข)"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        autoFocus
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-brand-400 focus:bg-white"
      />
      <button onClick={handleSave} disabled={saving} className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "..." : "บันทึก"}
      </button>
      <button onClick={() => { setEditing(false); setDate(depositedAt ? depositedAt.toISOString().slice(0, 10) : ""); }} className="text-xs text-gray-400">
        ยกเลิก
      </button>
    </div>
  );
}
