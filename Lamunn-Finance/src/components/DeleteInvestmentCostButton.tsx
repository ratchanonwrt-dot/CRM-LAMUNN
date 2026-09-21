"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function DeleteInvestmentCostButton({ id }: { id: string }) {
  const router = useRouter();
  const canEdit = useCanEdit("INVESTMENT_COST");
  const [loading, setLoading] = useState(false);

  if (!canEdit) return null;

  async function handleDelete() {
    if (!confirm("ลบรายการนี้?")) return;
    setLoading(true);
    await fetch(`/api/investment-costs/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">
      {loading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
