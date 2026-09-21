import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_ACCOUNTS_TAG } from "@/lib/accounting/refData";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code, nameTh, parentCode, isPostable, isActive, vatRole } = await req.json();

  const current = await prisma.accAccount.findUnique({ where: { id: params.id } });
  if (!current) return NextResponse.json({ error: "ไม่พบบัญชีนี้" }, { status: 404 });

  // แก้รหัสบัญชีได้ แต่ต้องไม่ชนของเดิม และต้องลากบัญชีลูกที่อ้างรหัสเก่าไว้ตามไปด้วย
  // (ความสัมพันธ์แม่-ลูกในผังบัญชีผูกกันด้วย "รหัส" ไม่ใช่ id — ถ้าไม่ตามไปแก้ ลูกจะหลุดกลุ่มเงียบ ๆ)
  const newCode = code !== undefined ? String(code).trim() : null;
  const codeChanged = newCode !== null && newCode !== "" && newCode !== current.code;
  if (codeChanged) {
    const clash = await prisma.accAccount.findUnique({ where: { code: newCode } });
    if (clash) return NextResponse.json({ error: `รหัสบัญชี ${newCode} ถูกใช้กับบัญชีอื่นแล้ว` }, { status: 400 });
  }

  const account = await prisma.$transaction(async (tx) => {
    const updated = await tx.accAccount.update({
      where: { id: params.id },
      data: {
        ...(codeChanged ? { code: newCode } : {}),
        ...(nameTh !== undefined ? { nameTh: String(nameTh).trim() } : {}),
        ...(parentCode !== undefined ? { parentCode: parentCode || null } : {}),
        ...(isPostable !== undefined ? { isPostable: Boolean(isPostable) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(vatRole !== undefined ? { vatRole: vatRole || null } : {}),
      },
    });
    if (codeChanged) {
      await tx.accAccount.updateMany({ where: { parentCode: current.code }, data: { parentCode: newCode } });
    }
    return updated;
  });

  revalidateAccountingRef(ACC_ACCOUNTS_TAG);
  return NextResponse.json({ account });
}

/** ลบได้เฉพาะบัญชีที่ยังไม่เคยถูกใช้ในสมุดรายวัน — ถ้าเคยใช้แล้วให้ปิดการใช้งานแทน
 * (ลบทิ้งจะทำให้ใบสำคัญเก่าอ้างอิงบัญชีที่หายไป งบย้อนหลังจะเพี้ยน) */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const used = await prisma.accJournalLine.count({ where: { accountId: params.id } });
  if (used > 0) {
    return NextResponse.json(
      { error: `บัญชีนี้ถูกใช้ในสมุดรายวันแล้ว ${used} รายการ ลบไม่ได้ — ปิดการใช้งานแทนได้` },
      { status: 400 }
    );
  }
  await prisma.accAccount.delete({ where: { id: params.id } });
  revalidateAccountingRef(ACC_ACCOUNTS_TAG);
  return NextResponse.json({ ok: true });
}
