/** ช่องทางขาย — แยกไว้เป็นไฟล์ของตัวเองเพราะฟอร์มฝั่ง client ต้องใช้ป้ายชื่อพวกนี้
 * (ถ้าอยู่รวมใน dailySales.ts จะลาก Prisma client เข้า bundle ฝั่งเบราว์เซอร์ไปด้วย) */

export const CHANNELS = {
  STOREFRONT: "STOREFRONT",
  GRAB: "GRAB",
  LINEMAN: "LINEMAN",
  TIKTOK: "TIKTOK",
  FB_LINE: "FB_LINE",
  PICKUP: "PICKUP",
  CATERING: "CATERING",
} as const;

export const CHANNEL_LABELS: Record<string, string> = {
  STOREFRONT: "หน้าร้าน",
  GRAB: "Grab",
  LINEMAN: "Lineman",
  TIKTOK: "TikTok",
  FB_LINE: "Facebook / Line",
  PICKUP: "รับหน้าร้าน (สั่งออนไลน์)",
  CATERING: "จัดเลี้ยง (Catering)",
};
