"use client";

import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleRefresh } from "@/lib/coalescedRefresh";

export type CellStatus = "idle" | "saving" | "saved" | "error";

/** บันทึกค่าจากช่องกรอกในตารางแบบไม่บล็อกผู้ใช้
 *
 * เดิมช่องจะถูก disable ระหว่างรอเซิร์ฟเวอร์ตอบ ทำให้กด Tab ไปช่องถัดไปแล้วต้องรอ
 * ตอนนี้ยิงบันทึกไปเบื้องหลัง ผู้ใช้กรอกช่องต่อไปได้ทันที ช่องที่กำลังบันทึกแค่เปลี่ยนสี
 * (เหลือง = กำลังบันทึก, เขียว = สำเร็จ, แดง = ไม่สำเร็จ) และ refresh หน้าจะถูกรวมเป็นครั้งเดียว
 * หลังหยุดกรอก (ดู coalescedRefresh.ts)
 *
 * save() คืน true/false ว่าสำเร็จไหม — ตารางที่อัปเดตยอดรวมฝั่ง client ไว้ก่อน (optimistic)
 * ใช้ค่านี้ตัดสินใจว่าจะย้อนตัวเลขกลับเมื่อบันทึกไม่ผ่าน */
export function useCellSave(url: string, method: "POST" | "PATCH" = "POST") {
  const router = useRouter();
  const [status, setStatus] = useState<CellStatus>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(payload: Record<string, unknown>): Promise<boolean> {
    setStatus("saving");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("saved");
      // startTransition = refresh ทำงานเป็นงานเบื้องหลัง ไม่แย่งคิวกับการพิมพ์ในช่องถัดไป
      scheduleRefresh(() => startTransition(() => router.refresh()));
      resetTimer.current = setTimeout(() => setStatus("idle"), 1500);
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  return { status, save };
}

/** สี border/พื้นหลังของช่องตามสถานะการบันทึก — ใช้ร่วมกันทุกตาราง */
export function cellStatusClass(status: CellStatus): string {
  switch (status) {
    case "saving":
      return "border-amber-300 bg-amber-50";
    case "saved":
      return "border-emerald-300 bg-emerald-50";
    case "error":
      return "border-rose-400 bg-rose-50";
    default:
      return "border-gray-200 bg-gray-50 focus:border-brand-400 focus:bg-white";
  }
}
