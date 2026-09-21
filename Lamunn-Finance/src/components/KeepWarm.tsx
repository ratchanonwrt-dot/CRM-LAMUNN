"use client";

import { useEffect } from "react";

const INTERVAL_MS = 3 * 60 * 1000;

/** ปลุก serverless function ไม่ให้หลับตราบใดที่มีคนเปิดเว็บค้างไว้ (ดูเหตุผลใน app/api/warm/route.ts)
 *
 * ยิงทันทีตอนกลับมาที่แท็บด้วย — เช่น สลับไป Excel 10 นาทีแล้วกลับมา instance อาจดับไปแล้ว
 * การปลุกตอน visibilitychange ทำให้ตอนผู้ใช้เริ่มกดเมนูจริงๆ (อีก 2-3 วิถัดมา) function ตื่นแล้ว */
export default function KeepWarm() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/warm", { cache: "no-store", keepalive: true }).catch(() => {
        // เงียบไว้ — heartbeat ล้มเหลวไม่กระทบการใช้งาน
      });
    };
    const id = setInterval(ping, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
