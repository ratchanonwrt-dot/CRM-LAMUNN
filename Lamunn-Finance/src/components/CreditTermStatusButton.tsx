"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreditTermStatusButton({ id, status }: { id: string; status: "PENDING" | "PAID" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = status === "PENDING" ? "PAID" : "PENDING";
    await fetch(`/api/credit-term/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={
        status === "PENDING"
          ? "rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
          : "rounded-lg bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
      }
    >
      {status === "PENDING" ? "รอชำระ — กดเพื่อทำเครื่องหมายว่าจ่ายแล้ว" : "ชำระแล้ว — กดเพื่อย้อนกลับ"}
    </button>
  );
}
