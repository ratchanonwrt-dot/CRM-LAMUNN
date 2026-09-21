import { PrismaClient } from ".prisma/client-finance";

// Standard Next.js singleton pattern so hot-reload in dev doesn't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prismaFinance?: PrismaClient };

// เชื่อมผ่าน pgbouncer (transaction mode) อยู่แล้ว (ดู DATABASE_URL) — ต่อ query param เข้าไปตอน
// runtime แทนที่จะแก้ DATABASE_URL ตรงๆ
//
// ขนาด pool ต่อ instance: เคยตั้ง 3 (กันไปแย่ง server pool ของ pgbouncer) แต่วัดจริงบน production แล้ว
// หน้า dashboard ยิง SQL ~15-20 statement ต่อการโหลด (batch 7 ก้อนซึ่งบางก้อนแตกเป็นหลาย query ข้างใน)
// พอบีบผ่าน 3 connection ทุก query ต่อคิวกันเอง — หน้าใช้เวลา ~5 วิทั้งที่แต่ละ query เร็ว จึงขยับเป็น 8:
// ยังต่ำพอไม่ชน pool ฝั่ง pgbouncer (client connection ของ pgbouncer transaction-mode ถูกมาก จำนวนผู้ใช้
// พร้อมกันจริงมีไม่ถึงสิบคน) แต่มากพอให้ Promise.all ในแต่ละหน้าวิ่งพร้อมกันจริงๆ ไม่ใช่ 3 ตัวต่อรอบ
function withConnectionLimit(url: string | undefined): string | undefined {
  if (!url) return url;
  const sep = url.includes("?") ? "&" : "?";
  return url.includes("connection_limit=") ? url : `${url}${sep}connection_limit=8`;
}

export const prisma =
  globalForPrisma.prismaFinance ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url: withConnectionLimit(process.env.DATABASE_URL) } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaFinance = prisma;
