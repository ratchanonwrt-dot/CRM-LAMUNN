"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

// ยกเลิกการปิดรอบ (เช่นเผลอกด "ปิดรอบ / อัปเดตยอด" ผิด) — ลบบันทึกทิ้ง กลับไปเป็นสถานะ "ยังไม่ปิดรอบ"
// (คำนวณสดจากยอดขายจริงเหมือนเดิม) แสดงเฉพาะรอบที่ยังไม่ได้รับเงินจริง (PENDING) เท่านั้น —
// รอบที่ปิดแล้วและมีเงินเข้าจริง (PAID) ต้องกดย้อนกลับเป็นรอชำระก่อนถึงจะยกเลิกได้ ป้องกันลบประวัติรับเงินจริงทิ้งโดยไม่ตั้งใจ
export default function CancelCreditTermButton({ id }: { id: string }) {
  const router = useRouter();
  const canEdit = useCanEdit("CREDIT_TERM");
  const [loading, setLoading] = useState(false);

  if (!canEdit) return null;

  async function handleCancel() {
    if (!confirm("ยกเลิกการปิดรอบนี้? ยอดจะกลับไปเป็นคำนวณสด ยังไม่บันทึกอีกครั้ง")) return;
    setLoading(true);
    await fetch(`/api/credit-term/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 hover:bg-gray-50 hover:text-red-500 disabled:opacity-50"
    >
      {loading ? "กำลังยกเลิก..." : "ยกเลิกการปิดรอบ"}
    </button>
  );
}
