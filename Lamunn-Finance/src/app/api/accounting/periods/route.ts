import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

/** ปิด/เปิดงวดบัญชี — งวดที่ปิดแล้วบันทึกหรือแก้ไขรายการย้อนหลังไม่ได้
 * ปิดงวดไม่ได้ถ้ายังมีใบสำคัญร่างค้างอยู่ เพราะร่างจะไม่เข้างบ ทำให้งบที่ปิดไปแล้วไม่ครบ */
export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { year, month, action } = await req.json();
  if (!year || !month) return NextResponse.json({ error: "ระบุปีและเดือน" }, { status: 400 });

  const y = Number(year);
  const m = Number(month);
  const closing = action === "close";

  if (closing) {
    const drafts = await prisma.accJournalEntry.count({
      where: {
        status: "DRAFT",
        date: { gte: new Date(Date.UTC(y, m - 1, 1)), lte: new Date(Date.UTC(y, m, 0)) },
      },
    });
    if (drafts > 0) {
      return NextResponse.json(
        { error: `ยังมีใบสำคัญร่างค้างอยู่ ${drafts} ใบในงวดนี้ — ผ่านรายการหรือลบให้หมดก่อนปิดงวด` },
        { status: 400 }
      );
    }
  }

  const period = await prisma.accPeriod.upsert({
    where: { year_month: { year: y, month: m } },
    create: {
      year: y,
      month: m,
      status: closing ? "CLOSED" : "OPEN",
      closedAt: closing ? new Date() : null,
      closedBy: closing ? staff.staffId : null,
    },
    update: {
      status: closing ? "CLOSED" : "OPEN",
      closedAt: closing ? new Date() : null,
      closedBy: closing ? staff.staffId : null,
    },
  });

  return NextResponse.json({ period });
}
