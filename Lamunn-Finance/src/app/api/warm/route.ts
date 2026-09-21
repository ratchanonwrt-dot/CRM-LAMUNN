import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db-finance";

export const dynamic = "force-dynamic";

/** heartbeat กัน cold start — เบราว์เซอร์ของคนที่ล็อกอินอยู่จะแตะ route นี้ทุก ~3 นาที (ดู components/KeepWarm.tsx)
 *
 * เว็บนี้มีคนใช้พร้อมกันแค่ 1-2 คน พอเว้นช่วงไม่กี่นาที Vercel จะดับ instance ทิ้ง กดครั้งถัดไป
 * ต้องรอ cold start (โหลด Next.js + Prisma engine + ต่อฐานข้อมูลใหม่) หลายวินาที ทั้งที่ตอน warm
 * ทุกหน้าตอบใน 100-600 ms — ตราบใดที่มีคนเปิดเว็บค้างไว้ heartbeat นี้จะทำให้ instance ไม่หลับ
 * (แผน Hobby ตั้ง cron ถี่กว่าวันละครั้งไม่ได้ จึงให้ฝั่ง client เป็นคนปลุกแทน)
 *
 * ยิง SELECT 1 ด้วยเพื่อให้ connection ของ Prisma ต่อค้างไว้ ไม่ใช่แค่โค้ดโหลดค้าง */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.staffId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const t0 = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, dbMs: Date.now() - t0 }, { headers: { "Cache-Control": "no-store" } });
}
