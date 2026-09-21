import { NextRequest, NextResponse } from "next/server";
import { requireSectionApi } from "@/lib/permissions";
import { parseDateOnly } from "@/lib/dates";
import { getSettingNumber } from "@/lib/settings";
import { postDailySales } from "@/lib/accounting/dailySales";
import { AccountingError } from "@/lib/accounting/post";

/** ลงบัญชียอดขายหลายวันรวดเดียว — วันไหนพลาดจะรายงานกลับทีละวัน ไม่ล้มทั้งชุด */
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { dates } = await req.json();
  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: "เลือกวันที่ที่จะลงบัญชีอย่างน้อย 1 วัน" }, { status: 400 });
  }

  const vatRate = await getSettingNumber("vatRate");
  const done: string[] = [];
  const failed: { date: string; error: string }[] = [];

  for (const d of dates as string[]) {
    try {
      await postDailySales(parseDateOnly(d), vatRate, staff.staffId);
      done.push(d);
    } catch (e) {
      if (e instanceof AccountingError) failed.push({ date: d, error: e.message });
      else throw e;
    }
  }

  return NextResponse.json({ done, failed });
}
