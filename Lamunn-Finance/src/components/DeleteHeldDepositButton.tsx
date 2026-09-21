"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function DeleteHeldDepositButton({ id }: { id: string }) {
  const router = useRouter();
  const canEdit = useCanEdit("HELD_DEPOSITS");
  const [loading, setLoading] = useState(false);

  if (!canEdit) return null;

  async function handleDelete() {
    if (!confirm("ลบรายการเงินมัดจำนี้?")) return;
    setLoading(true);
    await fetch(`/api/held-deposits/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">
      {loading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
