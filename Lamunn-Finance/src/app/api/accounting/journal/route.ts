import { NextRequest, NextResponse } from "next/server";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_JOURNAL_TAG } from "@/lib/accounting/refData";
import { parseDateOnly } from "@/lib/dates";
import { createEntry, AccountingError } from "@/lib/accounting/post";

interface LineInput {
  accountId: string;
  debit?: string | number;
  credit?: string | number;
  branchId?: string;
  partnerId?: string;
  memo?: string;
  docNo?: string;
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, journalType, description, lines, postNow } = await req.json();
  if (!date || !description) return NextResponse.json({ error: "กรอกวันที่และคำอธิบายรายการ" }, { status: 400 });
  if (!Array.isArray(lines)) return NextResponse.json({ error: "ไม่มีบรรทัดรายการ" }, { status: 400 });

  try {
    const entry = await createEntry({
      date: parseDateOnly(date),
      journalType: journalType || "GENERAL",
      description: String(description).trim(),
      status: postNow ? "POSTED" : "DRAFT",
      userId: staff.staffId,
      lines: (lines as LineInput[]).map((l) => ({
        accountId: l.accountId,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        branchId: l.branchId || null,
        partnerId: l.partnerId || null,
        memo: l.memo || null,
        docNo: l.docNo || null,
      })),
    });
    revalidateAccountingRef(ACC_JOURNAL_TAG);
    return NextResponse.json({ entry });
  } catch (e) {
    if (e instanceof AccountingError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
