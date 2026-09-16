"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const canEdit = useCanEdit();
  const [busy, setBusy] = useState(false);
  if (!canEdit) return null;

  async function remove() {
    if (!confirm("ลบรอบไลฟ์นี้ทั้งรอบ รวมทุกช่วงเวลาที่บันทึกไว้? (ย้อนกลับไม่ได้)")) return;
    setBusy(true);
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      alert("ลบไม่สำเร็จ");
      return;
    }
    router.push("/sessions");
    router.refresh();
  }

  return (
    <button onClick={remove} disabled={busy} className="rounded-xl border border-line px-3 py-1.5 text-xs text-stone-400 hover:border-red-200 hover:text-red-600 disabled:opacity-50">
      ลบรอบนี้
    </button>
  );
}
