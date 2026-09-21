import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** อ่าน session ครั้งเดียวต่อ request — layout ของ (app) เรียกครั้งหนึ่ง แล้วทุกหน้าเรียกซ้ำผ่าน
 * requireSectionPage อีกครั้ง (ถอดรหัส JWT + วิ่ง callback ของ next-auth ซ้ำสองรอบทุกครั้งที่เปิดหน้า
 * หรือ router.refresh) React cache() ทำให้รอบที่สองได้ผลลัพธ์เดิมทันที */
export const getSession = cache(() => getServerSession(authOptions));
