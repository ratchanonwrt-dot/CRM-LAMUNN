import { NextRequest, NextResponse } from "next/server";
import { loadPublicWeek } from "@/lib/publicWeek";
import { todayTH } from "@/lib/schedule";
import { phoneFromCookies } from "@/lib/me";

export const dynamic = "force-dynamic";

/** ตารางสัปดาห์แบบไม่ระบุตัวตน (สาธารณะ) — ถ้ามีคุกกี้เบอร์ จะติดป้าย mine ให้ช่วงของเบอร์นั้น */
export async function GET(req: NextRequest) {
  const week = await loadPublicWeek(req.nextUrl.searchParams.get("week") ?? undefined, req.nextUrl.searchParams.get("channel") ?? undefined, todayTH(), phoneFromCookies());
  return NextResponse.json(week, { headers: { "cache-control": "no-store" } });
}
