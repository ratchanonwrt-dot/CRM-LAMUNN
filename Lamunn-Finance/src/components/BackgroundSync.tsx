"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { describeBranchEvents } from "@/lib/posBranchEvents";
import type { PosBranchEvent } from "@lamunn/db-finance";

/** ดึงยอดจาก POS/IMS หลังจากหน้าแสดงผลเสร็จแล้ว แทนที่จะให้ผู้ใช้รอตอนโหลดหน้า
 *
 * ถ้ามีตัวเลขใหม่จริงจะรีเฟรชหน้าให้เอง ถ้าไม่มีอะไรเปลี่ยนก็เงียบไป ไม่รบกวน
 * ใส่ไว้เฉพาะตอนดูเดือนปัจจุบัน — เดือนย้อนหลังไม่มีอะไรให้ sync
 * ถ้า sync ไปเจอสาขาใหม่ใน POS แล้วสร้าง/เชื่อมให้อัตโนมัติ จะแจ้งไว้ตรงนี้ให้คนดูรู้ (ตรวจประเภทสาขา) */
export default function BackgroundSync() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "syncing" | "done">("idle");
  const [branchNotes, setBranchNotes] = useState<string[]>([]);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React strict mode ใน dev เรียก effect สองรอบ — กันยิงซ้ำ
    ran.current = true;

    // ยิง sync ได้ไม่เกิน 1 ครั้งต่อ 10 นาทีต่อเบราว์เซอร์ — ทุกครั้งที่เปิดหน้าภาพรวม/ยอดขายรายวัน
    // เดิมจะยิง sync (คิวรีหนักไป IMS หลายวินาที) แย่ง connection pool กับหน้าที่กำลังโหลด
    // ทั้งที่ยอด POS ไม่ได้เปลี่ยนทุกนาที — ถ้าเพิ่ง sync ไปไม่นานให้ข้ามไปเลย
    const KEY = "lamunn-finance:lastPosSync";
    const TEN_MIN = 10 * 60 * 1000;
    try {
      const last = Number(localStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < TEN_MIN) return;
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // localStorage ใช้ไม่ได้ (private mode) — ยิงตามปกติ
    }

    let cancelled = false;
    setState("syncing");

    fetch("/api/sync/recent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 4 }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { changed: number; branchEvents?: PosBranchEvent[] } | null) => {
        if (cancelled) return;
        setState("done");
        if (data?.branchEvents?.length) setBranchNotes(describeBranchEvents(data.branchEvents));
        if (data && (data.changed > 0 || data.branchEvents?.length)) router.refresh();
      })
      .catch(() => {
        // ดึงไม่สำเร็จก็ไม่เป็นไร — ตัวเลขในหน้ายังใช้ได้ และ cron ตี 4 ดึงให้อยู่แล้ว
        if (!cancelled) setState("done");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (branchNotes.length > 0) {
    return (
      <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        {branchNotes.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </div>
    );
  }

  if (state !== "syncing") return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
      <RefreshCw size={12} className="animate-spin" />
      กำลังดึงยอดล่าสุดจาก POS
    </span>
  );
}
