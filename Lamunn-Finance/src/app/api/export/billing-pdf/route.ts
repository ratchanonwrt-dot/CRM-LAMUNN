import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { computeMallGroupBilling } from "@/lib/billingCalc";
import { renderBillingPdf, type BranchBillingDocsData } from "@/lib/billingPdf";
import { getSetting } from "@/lib/settings";
import { formatBaht, formatThaiDate, thaiMonthLabel } from "@/lib/format";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return new Response("unauthorized", { status: 401 });

  const { searchParams } = req.nextUrl;
  const branchId = searchParams.get("branchId");
  const periodStartParam = searchParams.get("periodStart"); // YYYY-MM-DD
  const periodEndParam = searchParams.get("periodEnd");
  if (!branchId || !periodStartParam || !periodEndParam) {
    return new Response("missing branchId/periodStart/periodEnd", { status: 400 });
  }

  const [branch, companyName, companyTaxId] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: branchId },
      include: { rentConfig: true, creditTermConfig: { include: { billingGroup: true } } },
    }),
    getSetting("companyName"),
    getSetting("companyTaxId"),
  ]);
  if (!branch) return new Response("branch not found", { status: 404 });
  const group = branch.creditTermConfig?.billingGroup;
  if (!group) return new Response("สาขานี้ยังไม่ได้กำหนดประเภทวางบิล — ไปตั้งค่าที่หน้าตั้งค่าวางบิลก่อน", { status: 400 });
  if (!group.usesSummarySheet && !group.usesPaymentReceipt) {
    return new Response("ประเภทวางบิลนี้ยังไม่ได้เปิดใช้เอกสารใบสรุปยอด/ใบรับเงิน — ไปตั้งค่าที่หน้าตั้งค่าวางบิลก่อน", { status: 400 });
  }

  const periodStart = new Date(`${periodStartParam}T00:00:00.000Z`);
  const periodEnd = new Date(`${periodEndParam}T00:00:00.000Z`);
  const existing = await prisma.branchBilling.findUnique({
    where: { branchId_periodStart_periodEnd: { branchId, periodStart, periodEnd } },
  });
  const storefrontSalesIncVat = existing?.storefrontSalesIncVat ?? 0;
  const deliverySalesIncVat = existing?.deliverySalesIncVat ?? 0;
  const gpPercentStorefront = branch.rentConfig?.gpPercentStorefront ?? 0;
  const gpPercentDelivery = branch.rentConfig?.gpPercentDelivery ?? 0;
  const applyWht = group.usesWithholdingCert;
  const result = computeMallGroupBilling(storefrontSalesIncVat, deliverySalesIncVat, gpPercentStorefront, gpPercentDelivery, applyWht);

  const branchDoc: BranchBillingDocsData = {
    branchName: branch.name,
    branchAddress: branch.address ?? "",
    storefront:
      storefrontSalesIncVat > 0
        ? {
            channelLabel: "หน้าร้าน",
            salesIncVat: result.storefront.salesIncVat,
            gpPercent: gpPercentStorefront,
            gpNoVat: result.storefront.gpNoVat,
            gpVat: result.storefront.gpVat,
            totalDebt: result.storefront.totalDebt,
            wht: result.storefront.wht,
            netTransfer: result.storefront.netTransfer,
          }
        : null,
    delivery:
      deliverySalesIncVat > 0
        ? {
            channelLabel: "Delivery",
            salesIncVat: result.delivery.salesIncVat,
            gpPercent: gpPercentDelivery,
            gpNoVat: result.delivery.gpNoVat,
            gpVat: result.delivery.gpVat,
            totalDebt: result.delivery.totalDebt,
            wht: result.delivery.wht,
            netTransfer: result.delivery.netTransfer,
          }
        : null,
    receiptTotal: storefrontSalesIncVat + deliverySalesIncVat,
  };

  const hasAnyPage = group.usesPaymentReceipt || (group.usesSummarySheet && (branchDoc.storefront || branchDoc.delivery));
  if (!hasAnyPage) {
    return new Response("ยังไม่มียอดขายกรอกไว้สำหรับรอบนี้ — กรอกยอดขายก่อนถึงจะออก PDF ได้", { status: 400 });
  }

  const now = new Date();
  const buffer = await renderBillingPdf({
    companyName,
    companyTaxId,
    groupLegalName: branch.creditTermConfig?.mallLegalName ?? "",
    periodMonthLabel: thaiMonthLabel(periodStart.getUTCFullYear(), periodStart.getUTCMonth()),
    periodStartLabel: formatThaiDate(periodStart),
    periodEndLabel: formatThaiDate(periodEnd),
    branches: [branchDoc],
    includeSummarySheet: group.usesSummarySheet,
    includeReceipt: group.usesPaymentReceipt,
    applyWht,
    generatedAtLabel: formatThaiDate(now),
    fmtBaht: formatBaht,
  });

  const filename = `วางบิล_${branch.name}_${formatThaiDate(periodStart)}-${formatThaiDate(periodEnd)}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="billing.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
