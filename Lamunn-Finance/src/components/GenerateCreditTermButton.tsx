"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateCreditTermButton({
  branchId,
  periodStart,
  periodEnd,
  dueDate,
}: {
  branchId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    await fetch("/api/credit-term/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, periodStart, periodEnd, dueDate }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {loading ? "กำลังคำนวณ..." : "ปิดรอบ / อัปเดตยอด"}
    </button>
  );
}
