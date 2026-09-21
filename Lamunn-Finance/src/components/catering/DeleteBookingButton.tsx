"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteBookingButton({ id, redirectAfter }: { id: string; redirectAfter?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("ลบรายการจองนี้ทั้งหมด? (รายการย่อย/ทีมงาน/เช็คลิสต์ที่ผูกไว้จะถูกลบไปด้วย) ทำแล้วกู้คืนไม่ได้")) return;
    setLoading(true);
    await fetch(`/api/catering/bookings/${id}`, { method: "DELETE" });
    setLoading(false);
    if (redirectAfter) {
      router.push("/catering/bookings");
    } else {
      router.refresh();
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:underline disabled:opacity-50">
      {loading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
