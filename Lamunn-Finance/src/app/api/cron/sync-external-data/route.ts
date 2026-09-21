import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { syncPosDailySalesRange, syncCompanyChannelFromImsRange } from "@lamunn/db-finance";
import { CASH_ON_HAND_CACHE_TAG } from "@/lib/finance";
import { CREDIT_TERM_CACHE_TAG } from "@/lib/creditTermCalc";
import { SALES_DATA_CACHE_TAG } from "@/lib/reportsCalc";
import { revalidateBranches } from "@/lib/branchCache";
import { logActivity } from "@/lib/activityLog";
import { describeBranchEvents } from "@/lib/posBranchEvents";

// Runs automatically via Vercel Cron (see vercel.json) so branch sales (Lamunn IMS
// branch_sales_reports) and E-Commerce (Lamunn IMS extra_sales_reports) stay up to date
// even if nobody opens the Dashboard/Monthly page. Vercel signs cron requests with this
// header automatically; CRON_SECRET is the standard env var name Vercel looks for.
//
// Pulls a rolling 7-day window (not just today) so late-arriving or corrected staff
// reports for the last few days get picked up too, not just the current day.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const end = new Date();
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [pos, channelSynced] = await Promise.all([
    syncPosDailySalesRange(start, end),
    syncCompanyChannelFromImsRange(start, end),
  ]);
  const salesSynced = pos.changed;

  // sync สร้าง/ผูก/เปิดสาขาให้อัตโนมัติเมื่อ POS มียอดขาย → ล้างแคชรายชื่อสาขา + จดประวัติ
  if (pos.branchEvents.length > 0) {
    revalidateBranches();
    for (const line of describeBranchEvents(pos.branchEvents)) {
      await logActivity({ staffId: null, staffName: "ระบบ (cron sync POS)", action: "UPDATE", entity: "Branch", summary: line });
    }
  }

  // ยอดขายรายวันเปลี่ยน → ล้าง cache ยอดเงินสดสะสม/ยอดค้าง Credit Term ให้เห็นของใหม่ทันที
  if (salesSynced + channelSynced > 0) {
    revalidateTag(CASH_ON_HAND_CACHE_TAG);
    revalidateTag(CREDIT_TERM_CACHE_TAG);
    revalidateTag(SALES_DATA_CACHE_TAG);
  }

  return NextResponse.json({ ok: true, salesSynced, channelSynced, branchEvents: pos.branchEvents });
}
