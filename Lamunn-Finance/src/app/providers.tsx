"use client";

/** เดิมไฟล์นี้ครอบทั้งแอปด้วย <SessionProvider> ของ next-auth ซึ่งจะยิง GET /api/auth/session
 * ทุกครั้งที่เปิดหน้า (วัดจริงบน production ได้ 400-550 ms ต่อครั้ง)
 *
 * ถอดออกแล้วเพราะไม่มีคอมโพเนนต์ไหนในแอปเรียก useSession() เลยสักตัว — ข้อมูลผู้ใช้ทั้งหมด
 * ส่งมาจาก server component (ดู (app)/layout.tsx ที่อ่าน session ฝั่งเซิร์ฟเวอร์แล้วส่งเป็น prop ให้ Nav)
 * ส่วน signIn()/signOut() ใช้งานได้ตามปกติโดยไม่ต้องมี provider
 *
 * ถ้าวันหลังมีคอมโพเนนต์ที่ต้องใช้ useSession() ให้เอา SessionProvider กลับมา
 * และส่ง session ที่อ่านจากเซิร์ฟเวอร์เข้าไปเป็น prop ด้วย (ไม่งั้นจะกลับไปยิง /api/auth/session เหมือนเดิม)
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
