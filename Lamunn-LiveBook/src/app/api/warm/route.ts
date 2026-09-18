import { NextResponse } from "next/server";
import { prisma } from "@lamunn/db-live";

export const dynamic = "force-dynamic";

/** heartbeat กัน cold start — เบราว์เซอร์ที่เปิดเว็บค้างไว้จะแตะ route นี้ทุก ~3 นาที (ดู components/KeepWarm.tsx)
 * ยิง SELECT 1 ด้วยเพื่อให้ connection ของ Prisma ต่อค้างไว้ ไม่ใช่แค่โค้ดโหลดค้าง */
export async function GET() {
  const t0 = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, dbMs: Date.now() - t0 }, { headers: { "Cache-Control": "no-store" } });
}
