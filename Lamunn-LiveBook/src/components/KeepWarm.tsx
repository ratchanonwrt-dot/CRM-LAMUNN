"use client";

import { useEffect } from "react";

const INTERVAL_MS = 3 * 60 * 1000;

/** ปลุก serverless function ไม่ให้หลับตราบใดที่มีคนเปิดเว็บค้างไว้ — คนที่กำลังกรอกฟอร์มอยู่จะได้ไม่เจอ cold start ตอนกดส่ง
 * ยิงตอนกลับมาที่แท็บด้วย (เช่น สลับไป LINE แล้วกลับมา) */
export default function KeepWarm() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/warm", { cache: "no-store", keepalive: true }).catch(() => {});
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
