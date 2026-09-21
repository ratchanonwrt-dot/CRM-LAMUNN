import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { syncPosDailySalesRange, syncCompanyChannelFromImsRange } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { CASH_ON_HAND_CACHE_TAG } from "@/lib/finance";
import { CREDIT_TERM_CACHE_TAG } from "@/lib/creditTermCalc";
import { SALES_DATA_CACHE_TAG } from "@/lib/reportsCalc";
import { revalidateBranches } from "@/lib/branchCache";
import { logActivity } from "@/lib/activityLog";
import { describeBranchEvents } from "@/lib/posBranchEvents";

/** ดึงยอดจากระบบ POS/IMS ของช่วง 4 วันล่าสุดมาเติม
 *
 * เดิมงานนี้ทำอยู่กลางการ render หน้า "ยอดขายรายวัน" และ "ภาพรวม" ซึ่งต้องรอ
 * ยิง HTTP ไป Supabase ของระบบ POS อีกโปรเจกต์ก่อนหน้าจะขึ้น — เป็นสาเหตุหลักที่สองหน้านี้โหลดนาน
 *
 * ย้ายมาเป็น API ให้หน้าเว็บเรียกหลังจากแสดงผลเสร็จแล้วแทน (ดู components/BackgroundSync.tsx)
 * ตัวเลขจึงขึ้นทันทีจากฐานข้อมูล แล้วค่อยอัปเดตเองถ้ามีของใหม่จาก POS
 */
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("MONTHLY", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { days } = await req.json().catch(() => ({ days: 4 }));
  const span = Math.min(Math.max(Number(days) || 4, 1), 31);

  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - (span - 1) * 86400000);

  const [pos, imsChanged] = await Promise.all([
    syncPosDailySalesRange(start, end),
    syncCompanyChannelFromImsRange(start, end),
  ]);

  // sync สร้าง/ผูก/เปิดสาขาให้อัตโนมัติเมื่อ POS มียอดขาย → ล้างแคชรายชื่อสาขา + จดประวัติไว้ให้ตามได้
  if (pos.branchEvents.length > 0) {
    revalidateBranches();
    for (const line of describeBranchEvents(pos.branchEvents)) {
      await logActivity({ staffId: staff.staffId, staffName: `${staff.staffName} (sync POS อัตโนมัติ)`, action: "UPDATE", entity: "Branch", summary: line });
    }
  }

  // ยอดขายรายวันเปลี่ยน → ยอดเงินสดสะสม/ยอดค้าง Credit Term ที่ cache ไว้ต้องคำนวณใหม่
  if (pos.changed + imsChanged > 0) {
    revalidateTag(CASH_ON_HAND_CACHE_TAG);
    revalidateTag(CREDIT_TERM_CACHE_TAG);
    revalidateTag(SALES_DATA_CACHE_TAG);
  }

  return NextResponse.json({ changed: pos.changed + imsChanged, branchEvents: pos.branchEvents });
}
