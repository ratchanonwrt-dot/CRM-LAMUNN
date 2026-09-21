import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireSectionApi("CREDIT_TERM", "edit");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, usesSummarySheet, usesPaymentReceipt, usesTaxInvoice, usesWithholdingCert } = body;

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (usesSummarySheet !== undefined) data.usesSummarySheet = Boolean(usesSummarySheet);
  if (usesPaymentReceipt !== undefined) data.usesPaymentReceipt = Boolean(usesPaymentReceipt);
  if (usesTaxInvoice !== undefined) data.usesTaxInvoice = Boolean(usesTaxInvoice);
  if (usesWithholdingCert !== undefined) data.usesWithholdingCert = Boolean(usesWithholdingCert);

  const group = await prisma.billingGroup.update({ where: { id: params.id }, data });
  return NextResponse.json({ group });
}
