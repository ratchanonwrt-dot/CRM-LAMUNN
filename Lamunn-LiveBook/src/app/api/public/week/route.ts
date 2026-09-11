import { NextRequest, NextResponse } from "next/server";
import { loadPublicWeek } from "@/lib/publicWeek";
import { todayTH } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/** ตารางสัปดาห์แบบไม่ระบุตัวตน (สาธารณะ) */
export async function GET(req: NextRequest) {
  const week = await loadPublicWeek(req.nextUrl.searchParams.get("week") ?? undefined, req.nextUrl.searchParams.get("channel") ?? undefined, todayTH());
  return NextResponse.json(week, { headers: { "cache-control": "no-store" } });
}
