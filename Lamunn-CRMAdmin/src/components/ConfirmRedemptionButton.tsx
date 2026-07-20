"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmRedemptionButton({ redemptionId }: { redemptionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/redemptions/${redemptionId}/confirm`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ยืนยันไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "กำลังยืนยัน..." : "ยืนยันแลกรางวัล"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
