import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { postTaxInvoice } from "@/lib/accounting/dailySales";
import { AccountingError } from "@/lib/accounting/post";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("ACCOUNTING", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { action } = await req.json();
  try {
    if (action === "void") {
      const invoice = await prisma.accTaxInvoice.update({ where: { id: params.id }, data: { voided: true } });
      return NextResponse.json({ invoice });
    }
    if (action === "post") {
      return NextResponse.json({ entry: await postTaxInvoice(params.id, staff.staffId) });
    }
    return NextResponse.json({ error: "action ต้องเป็น void หรือ post" }, { status: 400 });
  } catch (e) {
    if (e instanceof AccountingError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
