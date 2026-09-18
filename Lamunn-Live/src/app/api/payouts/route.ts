import { NextRequest, NextResponse } from "next/server";
import { requireStaff, EDITOR_ROLES } from "@/lib/requireStaff";
import { computeDailyPayouts, approvePayout, parseIsoDate } from "@/lib/payouts";
import { optionalText } from "@/lib/validation";
import { addDays, todayTH } from "@/lib/schedule";

export const dynamic = "force-dynamic";

/** GET ?from&to — ยอดจ่ายรายวันต่อคน (ทุกสถานะ) สำหรับหน้าแอดมิน */
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const today = todayTH();
  const from = parseIsoDate(req.nextUrl.searchParams.get("from")) ?? addDays(today, -13);
  const to = parseIsoDate(req.nextUrl.searchParams.get("to")) ?? today;
  const rows = await computeDailyPayouts(from, to);
  return NextResponse.json({ rows });
}

/**
 * POST — อนุมัติยอด (ผู้จัดการขึ้นไป)
 * body: { date, streamerId?, note? }  — ไม่ส่ง streamerId = อนุมัติทุกคนของวันนั้นที่พร้อม (กรอกยอดแล้ว, ยังไม่จ่าย)
 */
export async function POST(req: NextRequest) {
  const staff = await requireStaff(EDITOR_ROLES);
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const date = parseIsoDate(body.date);
  if (!date) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  const streamerId = typeof body.streamerId === "string" && body.streamerId ? body.streamerId : null;
  const note = optionalText(body.note);

  const rows = await computeDailyPayouts(date, date);
  const targets = rows.filter((r) => (streamerId ? r.streamerId === streamerId : r.status === "READY" || (r.status === "APPROVED" && r.changed)));
  if (streamerId && targets.length === 0) return NextResponse.json({ error: "ไม่พบยอดของคนไลฟ์นี้ในวันที่เลือก" }, { status: 404 });

  const done: string[] = [];
  const skipped: string[] = [];
  for (const r of targets) {
    try {
      await approvePayout(r, staff.staffId, streamerId ? note : undefined);
      done.push(r.streamerName);
    } catch (e) {
      skipped.push(`${r.streamerName}: ${(e as Error).message}`);
    }
  }
  if (streamerId && skipped.length) return NextResponse.json({ error: skipped[0].split(": ").slice(1).join(": ") }, { status: 400 });
  return NextResponse.json({ ok: true, approved: done, skipped });
}
