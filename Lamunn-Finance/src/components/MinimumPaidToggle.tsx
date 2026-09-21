"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export default function MinimumPaidToggle({
  branchId,
  year,
  month,
  minimumPaid,
}: {
  branchId: string;
  year: number;
  month: number;
  minimumPaid: boolean;
}) {
  const router = useRouter();
  const canEdit = useCanEdit("RENT");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!canEdit || loading) return;
    setLoading(true);
    await fetch("/api/rent-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, year, month, minimumPaid: !minimumPaid }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <label className={`flex items-center gap-1.5 text-xs ${canEdit ? "cursor-pointer" : "cursor-default"}`}>
      <input type="checkbox" checked={minimumPaid} disabled={!canEdit || loading} onChange={toggle} className="h-3.5 w-3.5 accent-brand-600" />
      <span className={minimumPaid ? "font-medium text-emerald-700" : "text-gray-500"}>
        จ่าย Minimum ให้ห้างไปแล้ว{minimumPaid ? " ✓" : ""}
      </span>
    </label>
  );
}
