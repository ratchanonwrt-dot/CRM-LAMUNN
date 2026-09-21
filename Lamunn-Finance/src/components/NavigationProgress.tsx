"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * แถบโหลดบางๆ ด้านบนสุด — ขึ้นทันทีที่กดลิงก์ภายในเว็บ แล้วหายเองเมื่อหน้าใหม่โหลดเสร็จ (pathname เปลี่ยน)
 * กันปัญหา "กดแล้วเหมือนค้าง ไม่รู้ว่ากำลังโหลดอยู่หรือเปล่า" — ยังมีประโยชน์อยู่แม้เปิด prefetch แล้ว
 * เพราะ prefetch โหลดไว้แค่ skeleton ของหน้าปลายทาง ส่วนข้อมูลจริงยังต้องรอเซิร์ฟเวอร์อยู่ดี
 *
 * ดักคลิกที่ document level แทนการครอบทุก <Link> เอง เพราะครอบคลุมลิงก์ทุกจุดในเว็บอัตโนมัติ (ไม่ใช่แค่ในเมนู)
 */
export default function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // หมายเหตุ: ห้ามเช็ค e.defaultPrevented ตรงนี้ — <Link> ของ Next.js เรียก preventDefault() เอง
      // เสมอเป็นส่วนหนึ่งของการทำ client-side navigation event bubble จาก <a> ขึ้นมาถึง document
      // (ที่ listener นี้ผูกอยู่) หลังจากนั้น ถ้าเช็ค defaultPrevented ที่นี่จะเจอ true เสมอสำหรับลิงก์ปกติ
      // ทุกอัน กลายเป็นกรองคลิกที่ต้องการจับออกไปหมด (บั๊กที่เจอจริงตอนทดสอบ — แถบไม่ขึ้นเลยสักครั้ง)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || anchor.target === "_blank") return;
      const current = location.pathname + location.search;
      if (href === current) return;
      setLoading(true);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full overflow-hidden bg-brand-100">
      <div className="h-full w-1/3 animate-[nav-progress_1s_ease-in-out_infinite] bg-brand-600" />
    </div>
  );
}
