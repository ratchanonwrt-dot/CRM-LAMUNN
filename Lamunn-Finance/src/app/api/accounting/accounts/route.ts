import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { revalidateAccountingRef, ACC_ACCOUNTS_TAG } from "@/lib/accounting/refData";

export async function GET() {
  const staff = await requireSectionApi("ACCOUNTING", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const accounts = await prisma.accAccount.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { code, nameTh, type, parentCode, isPostable, vatRole } = await req.json();
  if (!code || !nameTh || !type) {
    return NextResponse.json({ error: "กรอกรหัสบัญชี ชื่อบัญชี และหมวดให้ครบ" }, { status: 400 });
  }

  const exists = await prisma.accAccount.findUnique({ where: { code: String(code).trim() } });
  if (exists) return NextResponse.json({ error: `รหัสบัญชี ${code} มีอยู่แล้ว` }, { status: 400 });

  const account = await prisma.accAccount.create({
    data: {
      code: String(code).trim(),
      nameTh: String(nameTh).trim(),
      type,
      parentCode: parentCode || null,
      isPostable: isPostable !== false,
      vatRole: vatRole || null,
    },
  });
  revalidateAccountingRef(ACC_ACCOUNTS_TAG);
  return NextResponse.json({ account });
}
