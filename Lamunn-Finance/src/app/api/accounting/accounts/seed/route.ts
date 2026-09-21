import { NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_ACCOUNTS_TAG } from "@/lib/accounting/refData";
import { DEFAULT_CHART } from "@/lib/accounting/chartOfAccounts";

/** ติดตั้งผังบัญชีเริ่มต้น — เพิ่มเฉพาะรหัสที่ยังไม่มี ไม่ทับของเดิมที่ทีมบัญชีแก้ไว้แล้ว
 * กดซ้ำได้ปลอดภัย (ใช้เติมบัญชีใหม่ที่เพิ่มเข้ามาในผังมาตรฐานภายหลัง) */
export async function POST() {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.accAccount.findMany({ select: { code: true } });
  const have = new Set(existing.map((a) => a.code));
  const toCreate = DEFAULT_CHART.filter((a) => !have.has(a.code));

  if (toCreate.length > 0) {
    await prisma.accAccount.createMany({
      data: toCreate.map((a, i) => ({
        code: a.code,
        nameTh: a.nameTh,
        type: a.type,
        parentCode: a.parentCode ?? null,
        isPostable: a.isPostable !== false,
        vatRole: a.vatRole ?? null,
        sortOrder: i,
      })),
    });
  }

  revalidateAccountingRef(ACC_ACCOUNTS_TAG);
  return NextResponse.json({ created: toCreate.length, skipped: DEFAULT_CHART.length - toCreate.length });
}
