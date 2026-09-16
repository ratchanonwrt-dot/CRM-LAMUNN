"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function DeleteShiftButton({ shiftId, weekParam }: { shiftId: string; weekParam: string }) {
  const router = useRouter();
  const canEdit = useCanEdit();
  const [busy, setBusy] = useState(false);
  if (!canEdit) return null;

  async function remove() {
    if (!confirm("ลบกะนี้ออกจากตาราง? (ยอดที่กรอกไว้จะยังอยู่ในรอบไลฟ์ของวันนั้น แต่จะไม่ผูกกับกะนี้อีก)")) return;
    setBusy(true);
    const res = await fetch(`/api/shifts/${shiftId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      alert("ลบไม่สำเร็จ");
      return;
    }
    router.push(`/schedule?week=${weekParam}`);
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className="rounded-xl border border-line px-3 py-1.5 text-xs text-stone-400 hover:border-red-200 hover:text-red-600 disabled:opacity-50">
      ลบกะนี้
    </button>
  );
}
