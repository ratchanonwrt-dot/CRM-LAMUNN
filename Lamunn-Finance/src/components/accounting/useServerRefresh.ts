"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

/** router.refresh() ที่รู้ว่าตัวเองยังโหลดอยู่
 *
 * ของเดิมทุกปุ่มทำ setBusy(false) แล้วค่อย router.refresh() — ปุ่มกลับมากดได้ทั้งที่หน้ายังไม่เปลี่ยน
 * อีกเป็นวินาที ผู้ใช้เลยรู้สึกว่า "กดแล้วค้าง" ตัวนี้คืน `refreshing` ให้ปุ่มใช้แสดงสถานะจนกว่า
 * ข้อมูลใหม่จากเซิร์ฟเวอร์จะขึ้นจอจริง และคอมโพเนนต์ที่อัปเดตหน้าจอเองล่วงหน้า (optimistic)
 * ก็ยังเรียก refresh() เบื้องหลังเพื่อให้ตัวเลขสรุป/แบนเนอร์ที่เซิร์ฟเวอร์คำนวณตามมาทีหลังได้ */
export function useServerRefresh() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);
  return { refreshing, refresh, router };
}
