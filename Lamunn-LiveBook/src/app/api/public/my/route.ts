import { NextResponse } from "next/server";
import { phoneFromCookies, maskPhone } from "@/lib/me";
import { todayTH } from "@/lib/schedule";
import { loadMyRequests } from "@/lib/myRequests";

export const dynamic = "force-dynamic";

/** ช่วงทั้งหมดของเบอร์ที่จำไว้ (60 วันล่าสุด + อนาคต) พร้อมบอกว่าแก้/ยกเลิกได้ไหม */
export async function GET() {
  const phone = phoneFromCookies();
  if (!phone) return NextResponse.json({ phone: null, requests: [] });
  return NextResponse.json({ phone: maskPhone(phone), requests: await loadMyRequests(phone, todayTH()) });
}
