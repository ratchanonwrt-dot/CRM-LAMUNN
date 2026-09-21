"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatBaht } from "@/lib/format";

/** ค่าที่ "กรอกเอง" ในหน้าสถานะการเงินบริษัท (เงินในบัญชี / เงินค้าง Tiktok) เก็บไว้ฝั่ง client
 * เพื่อให้ตัวเลขและยอดรวมด้านบนขยับทันทีที่กดบันทึก ไม่ต้องรอหน้า render ใหม่จากเซิร์ฟเวอร์
 * (หน้านี้คำนวณเงินสดสะสม + Credit Term ค้างรับ ซึ่งใช้เวลาเป็นวินาที) */
interface LiveState {
  bank: number;
  tiktok: number;
  setBank: (v: number) => void;
  setTiktok: (v: number) => void;
}

const Ctx = createContext<LiveState | null>(null);

export function CompanyStatusProvider({ initialBank, initialTiktok, children }: { initialBank: number; initialTiktok: number; children: ReactNode }) {
  const [bank, setBank] = useState(initialBank);
  const [tiktok, setTiktok] = useState(initialTiktok);
  return <Ctx.Provider value={{ bank, tiktok, setBank, setTiktok }}>{children}</Ctx.Provider>;
}

export function useCompanyLive(): LiveState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompanyLive ต้องอยู่ใน CompanyStatusProvider");
  return v;
}

/** ยอดรวมที่มีเงินในบัญชี + Tiktok เป็นส่วนประกอบ — base คือส่วนที่เหลือซึ่งมาจากเซิร์ฟเวอร์ */
export function LiveTotal({ base, className }: { base: number; className?: string }) {
  const { bank, tiktok } = useCompanyLive();
  return <span className={className}>{formatBaht(base + bank + tiktok)} บาท</span>;
}
