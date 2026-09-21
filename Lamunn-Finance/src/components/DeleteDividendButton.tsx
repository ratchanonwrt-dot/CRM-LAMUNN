"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteDividendButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบรายการปันผลนี้?")) return;
    setLoading(true);
    await fetch(`/api/dividend-payments/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">
      {loading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
