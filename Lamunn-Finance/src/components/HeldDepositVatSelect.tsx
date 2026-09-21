"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

type VatType = "INCLUDES_VAT" | "EXCLUDES_VAT" | "NO_VAT";

const VAT_META: Record<VatType, { label: string; badge: string }> = {
  INCLUDES_VAT: { label: "รวม VAT", badge: "bg-emerald-100 text-emerald-700" },
  EXCLUDES_VAT: { label: "ไม่รวม VAT", badge: "bg-sky-100 text-sky-700" },
  NO_VAT: { label: "ไม่มี VAT", badge: "bg-gray-100 text-gray-600" },
};

/** เลือกว่าตัวเลขมัดจำที่กรอกไว้ รวม VAT / ไม่รวม VAT / หรือรายการนี้ไม่มี VAT — แก้ได้ทีละแถวในตาราง */
export default function HeldDepositVatSelect({ id, vatType }: { id: string; vatType: VatType | null }) {
  const router = useRouter();
  const canEdit = useCanEdit("HELD_DEPOSITS");
  const [loading, setLoading] = useState(false);
  const meta = vatType ? VAT_META[vatType] : null;

  async function handleChange(next: string) {
    if (loading) return;
    setLoading(true);
    await fetch(`/api/held-deposits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vatType: next || null }),
    });
    setLoading(false);
    router.refresh();
  }

  if (!canEdit) {
    return meta ? (
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.badge}`}>{meta.label}</span>
    ) : (
      <span className="text-xs text-gray-300">-</span>
    );
  }

  return (
    <select
      value={vatType ?? ""}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-50 ${meta ? meta.badge : "bg-amber-50 text-amber-600"}`}
    >
      <option value="">ยังไม่ระบุ</option>
      {(Object.keys(VAT_META) as VatType[]).map((v) => (
        <option key={v} value={v}>
          {VAT_META[v].label}
        </option>
      ))}
    </select>
  );
}
