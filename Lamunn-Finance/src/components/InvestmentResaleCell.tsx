"use client";

import { useState } from "react";
import { useCanEdit } from "@/lib/RoleContext";
import { useCellSave, cellStatusClass } from "@/lib/useCellSave";
import { formatBaht } from "@/lib/format";

/** ช่องกรอก "ราคาที่น่าจะขายทิ้งได้" แก้ได้ในตารางเลย — บันทึกตอนออกจากช่อง (blur) แบบไม่บล็อก
 * ของเก่าที่จดไว้ก่อนมีช่องนี้จะได้เติมย้อนหลังได้โดยไม่ต้องลบแล้วจดใหม่ */
export default function InvestmentResaleCell({ id, value }: { id: string; value: number | null }) {
  const canEdit = useCanEdit("INVESTMENT_COST");
  const [val, setVal] = useState(value == null ? "" : String(value));
  const { status, save } = useCellSave(`/api/investment-costs/${id}`, "PATCH");

  if (!canEdit) return <span>{value == null ? "-" : formatBaht(value)}</span>;

  function handleBlur() {
    if (val === (value == null ? "" : String(value))) return;
    void save({ resaleValue: val });
  }

  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={val}
      placeholder="-"
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      className={`w-28 rounded-lg border px-2 py-1 text-right text-sm outline-none transition-colors ${cellStatusClass(status)}`}
    />
  );
}
