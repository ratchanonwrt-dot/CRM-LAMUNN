import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";

export const dynamic = "force-dynamic";

/** ปลุก serverless function ให้ตื่นอยู่ตลอด (Vercel Cron ทุก 5 นาที — ดู vercel.json)
 *
 * ปัญหา: เว็บนี้มีคนใช้พร้อมกันแค่ 1-2 คน พอไม่มีใครเปิดสักพัก Vercel จะดับ instance ทิ้ง
 * คนถัดไปที่เปิดจึงต้องรอ "cold start" (โหลด Next.js + Prisma engine ~16MB + ต่อฐานข้อมูลใหม่)
 * หลายวินาที ทั้งที่ตอน warm ทุกหน้าตอบใน 100-600 ms — ยิ่งคนใช้น้อยยิ่งเจอบ่อย
 *
 * วิธีแก้: ให้ cron แตะ route นี้เป็นระยะ พร้อมยิง query เบาๆ หนึ่งครั้งเพื่อให้ connection pool
 * ของ Prisma ต่อค้างไว้ด้วย (ไม่ใช่แค่โหลดโค้ดค้างไว้เฉยๆ) — route ทุกตัวของ App Router อยู่ใน
 * function เดียวกันบน Vercel การปลุกตัวนี้จึงปลุกทั้งเว็บ */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, dbMs: Date.now() - t0 });
}
