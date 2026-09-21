"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBaht } from "@/lib/format";
import { useCanEdit } from "@/lib/RoleContext";

interface Props {
  id: string;
  status: "PENDING" | "PAID";
  netAmount: number;
  receivedAmount?: number | null;
  shortfallAmount?: number;
}

export default function CreditTermStatusButton({ id, status, netAmount, receivedAmount, shortfallAmount }: Props) {
  const router = useRouter();
  const canEdit = useCanEdit("CREDIT_TERM");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(netAmount));

  if (!canEdit) {
    return (
      <div className="text-xs">
        <span
          className={`rounded-lg px-2.5 py-1.5 font-medium ${
            status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {status === "PAID" ? `รับเงินแล้ว ${formatBaht(receivedAmount ?? netAmount)} บาท` : "รอชำระ"}
        </span>
        {!!shortfallAmount && shortfallAmount > 0 && (
          <p className="mt-1 font-medium text-amber-600">ค้างอยู่ {formatBaht(shortfallAmount)} บาท</p>
        )}
      </div>
    );
  }

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    await fetch(`/api/credit-term/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (status === "PAID") {
    return (
      <div className="text-xs">
        <button
          onClick={() => patch({ status: "PENDING" })}
          disabled={loading}
          className="rounded-lg bg-emerald-100 px-2.5 py-1.5 font-medium text-emerald-700 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : `รับเงินแล้ว ${formatBaht(receivedAmount ?? netAmount)} บาท — กดเพื่อย้อนกลับ`}
        </button>
        {!!shortfallAmount && shortfallAmount > 0 && (
          <p className="mt-1 font-medium text-amber-600">ค้างอยู่ {formatBaht(shortfallAmount)} บาท (ทบไปงวดหน้าให้แล้ว)</p>
        )}
      </div>
    );
  }

  if (editing) {
    const parsed = Number(amount) || 0;
    const shortfall = Math.max(0, netAmount - parsed);
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-brand-400 focus:bg-white"
          />
          <button
            onClick={() => patch({ status: "PAID", receivedAmount: parsed })}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "ยืนยันรับเงิน"}
          </button>
          <button onClick={() => setEditing(false)} disabled={loading} className="text-xs text-gray-400 disabled:opacity-50">
            ยกเลิก
          </button>
        </div>
        {shortfall > 0 ? (
          <p className="text-xs font-medium text-amber-600">
            ได้รับไม่ครบ — จะค้าง {formatBaht(shortfall)} บาท ทบไปรวมยอดงวดหน้าให้อัตโนมัติ
          </p>
        ) : parsed > netAmount ? (
          <p className="text-xs text-gray-400">ได้รับเกินยอดที่ต้องรับ {formatBaht(parsed - netAmount)} บาท</p>
        ) : null}
        <button
          onClick={() => patch({ status: "PAID", receivedAmount: 0 })}
          disabled={loading}
          className="w-fit text-xs text-amber-600 underline hover:text-amber-700 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : `ห้างยังไม่จ่ายเลย — เลื่อนทั้งก้อน ${formatBaht(netAmount)} บาท ไปงวดหน้า`}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setAmount(String(netAmount));
        setEditing(true);
      }}
      disabled={loading}
      className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700 disabled:opacity-50"
    >
      รอชำระ — กดเพื่อบันทึกยอดที่ได้รับ
    </button>
  );
}
