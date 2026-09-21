"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

type Status = "PENDING" | "TRANSFER_SCHEDULED" | "PAID_AWAITING_BILL" | "RECEIPT_RECEIVED";

const STEPS: { status: Status; label: string }[] = [
  { status: "PENDING", label: "ยังไม่จ่าย" },
  { status: "TRANSFER_SCHEDULED", label: "ตั้งโอนแล้ว" },
  { status: "PAID_AWAITING_BILL", label: "จ่ายแล้วรอบิล" },
  { status: "RECEIPT_RECEIVED", label: "ได้รับใบเสร็จแล้ว" },
];

export default function RentPaymentChecklist({
  branchId,
  year,
  month,
  status,
  compact = false,
}: {
  branchId: string;
  year: number;
  month: number;
  status: Status;
  compact?: boolean;
}) {
  const router = useRouter();
  const canEdit = useCanEdit("RENT");
  const [loading, setLoading] = useState(false);
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  async function setStatus(next: Status) {
    if (!canEdit || loading) return;
    setLoading(true);
    await fetch("/api/rent-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branchId, year, month, status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className={compact ? "" : "mt-3 border-t border-gray-100 pt-3"}>
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          const isFinal = s.status === "RECEIPT_RECEIVED";
          return (
            <button
              key={s.status}
              type="button"
              disabled={!canEdit || loading}
              onClick={() => setStatus(s.status)}
              className={`min-h-[38px] rounded-full px-3 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed md:min-h-0 md:py-1.5 ${
                isCurrent
                  ? isFinal
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-brand-600 text-white shadow-sm"
                  : isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-400"
              } ${canEdit ? "hover:opacity-90" : ""}`}
            >
              {isDone && "✓ "}
              {s.label}
            </button>
          );
        })}
      </div>
      {canEdit && currentIndex > 0 && (
        <button type="button" disabled={loading} onClick={() => setStatus("PENDING")} className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600 disabled:opacity-50">
          ล้างสถานะกลับเป็นยังไม่จ่าย
        </button>
      )}
      {loading && <p className="mt-1.5 text-[11px] text-brand-500">กำลังบันทึก...</p>}
    </div>
  );
}
