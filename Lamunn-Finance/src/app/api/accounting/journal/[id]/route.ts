import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_JOURNAL_TAG } from "@/lib/accounting/refData";
import { parseDateOnly } from "@/lib/dates";
import { postEntry, voidEntry, unpostEntry, restoreEntry, updateEntry, AccountingError } from "@/lib/accounting/post";

interface LineInput {
  accountId: string;
  debit?: string | number;
  credit?: string | number;
  branchId?: string;
  partnerId?: string;
  memo?: string;
  docNo?: string;
}

/** แก้ไขใบสำคัญร่าง — วันที่/ประเภท/คำอธิบาย/บรรทัดทั้งหมดแทนที่ของเดิม */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { date, journalType, description, lines } = await req.json();
  if (!date || !description) return NextResponse.json({ error: "กรอกวันที่และคำอธิบายรายการ" }, { status: 400 });
  if (!Array.isArray(lines)) return NextResponse.json({ error: "ไม่มีบรรทัดรายการ" }, { status: 400 });

  try {
    const entry = await updateEntry(params.id, {
      date: parseDateOnly(date),
      journalType: journalType || "GENERAL",
      description: String(description).trim(),
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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action } = await req.json();
  try {
    if (action === "post") return NextResponse.json({ entry: await postEntry(params.id, staff.staffId) });
    if (action === "void") return NextResponse.json({ entry: await voidEntry(params.id, staff.staffId) });
    if (action === "unpost") return NextResponse.json({ entry: await unpostEntry(params.id, staff.staffId) });
    if (action === "restore") return NextResponse.json({ entry: await restoreEntry(params.id, staff.staffId) });
    return NextResponse.json({ error: "action ต้องเป็น post, unpost, restore หรือ void" }, { status: 400 });
  } catch (e) {
    if (e instanceof AccountingError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

/** ลบได้เฉพาะใบสำคัญที่ยังเป็นร่าง — ใบที่ผ่านรายการแล้วต้องใช้ "ยกเลิก" เพื่อคงร่องรอยไว้ */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const entry = await prisma.accJournalEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "ไม่พบใบสำคัญนี้" }, { status: 404 });
  if (entry.status !== "DRAFT") {
    return NextResponse.json({ error: "ใบสำคัญที่ผ่านรายการแล้วลบไม่ได้ — ใช้ปุ่มยกเลิกแทน" }, { status: 400 });
  }
  await prisma.accJournalEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
