import { NextRequest } from "next/server";
import { prisma, computePeriodsForMonth } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { computeMallGroupBilling } from "@/lib/billingCalc";
import { buildXlsx, xlsxResponse, type ExportSheet } from "@/lib/exportXlsx";
import { formatThaiDate, thaiMonthLabel } from "@/lib/format";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return new Response("unauthorized", { status: 401 });

  const { searchParams } = req.nextUrl;
  const sectionIds = new Set((searchParams.get("sections") ?? "").split(",").filter(Boolean));
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(searchParams.get("month")) || now.getUTCMonth() + 1;
  const monthIndex0 = month - 1;

  const [groups, branches] = await Promise.all([
    prisma.billingGroup.findMany({ where: { id: { in: Array.from(sectionIds) } }, orderBy: { sortOrder: "asc" } }),
    prisma.branch.findMany({ where: { type: "CREDIT_TERM" }, include: { rentConfig: true, creditTermConfig: true } }),
  ]);

  const assignedBranches = branches.filter((b) => b.creditTermConfig?.billingGroupId && sectionIds.has(b.creditTermConfig.billingGroupId));
  const periodTargets = assignedBranches.flatMap((b) => computePeriodsForMonth(b.creditTermConfig!, year, monthIndex0).map((p) => ({ branch: b, period: p })));

  const existingBillings = await prisma.branchBilling.findMany({ where: { branchId: { in: assignedBranches.map((b) => b.id) } } });
  const existingMap = new Map(existingBillings.map((e) => [`${e.branchId}_${e.periodStart.toISOString()}_${e.periodEnd.toISOString()}`, e]));

  const sheets: ExportSheet[] = [];
  for (const group of groups) {
    const groupTargets = periodTargets.filter(({ branch }) => branch.creditTermConfig?.billingGroupId === group.id);
    const rows = groupTargets.map(({ branch, period }) => {
      const existing = existingMap.get(`${branch.id}_${period.periodStart.toISOString()}_${period.periodEnd.toISOString()}`);
      const storefrontSalesIncVat = existing?.storefrontSalesIncVat ?? 0;
      const deliverySalesIncVat = existing?.deliverySalesIncVat ?? 0;
      const dueDays = branch.creditTermConfig?.billingDueDays;
      const dueDateIso = dueDays != null ? toISODate(new Date(period.periodEnd.getTime() + dueDays * 86400000)) : null;
      const result = computeMallGroupBilling(
        storefrontSalesIncVat,
        deliverySalesIncVat,
        branch.rentConfig?.gpPercentStorefront ?? 0,
        branch.rentConfig?.gpPercentDelivery ?? 0,
        group.usesWithholdingCert
      );
      return {
        branch: branch.name,
        period: `${period.label} (${formatThaiDate(period.periodStart)} – ${formatThaiDate(period.periodEnd)})`,
        storefrontSalesIncVat,
        deliverySalesIncVat,
        salesIncVatTotal: result.storefront.salesIncVat + result.delivery.salesIncVat,
        gpNoVat: result.storefront.gpNoVat + result.delivery.gpNoVat,
        gpVat: result.storefront.gpVat + result.delivery.gpVat,
        wht: result.storefront.wht + result.delivery.wht,
        finalNetTransfer: result.finalNetTransfer,
        dueDate: dueDateIso ? formatThaiDate(new Date(dueDateIso)) : "-",
        billingDate: existing?.billingDate ? formatThaiDate(existing.billingDate) : "ยังไม่วางบิล",
      };
    });
    sheets.push({
      name: group.name,
      columns: [
        { header: "สาขา", key: "branch", width: 22 },
        { header: "งวด", key: "period", width: 30 },
        { header: "ยอดขายหน้าร้าน (รวม VAT)", key: "storefrontSalesIncVat", width: 20 },
        { header: "ยอดขาย Delivery (รวม VAT)", key: "deliverySalesIncVat", width: 20 },
        { header: "ยอดขายรวม VAT", key: "salesIncVatTotal", width: 18 },
        { header: "GP ไม่รวม VAT", key: "gpNoVat", width: 16 },
        { header: "VAT ของ GP", key: "gpVat", width: 14 },
        { header: "หัก ณ ที่จ่าย 3%", key: "wht", width: 16 },
        { header: "ยอดสุดท้ายที่ห้างต้องโอนคืน", key: "finalNetTransfer", width: 22 },
        { header: "ครบกำหนดวางบิล", key: "dueDate", width: 18 },
        { header: "วันที่วางบิลจริง", key: "billingDate", width: 18 },
      ],
      rows,
    });
  }

  const buffer = await buildXlsx(sheets);
  return xlsxResponse(buffer, `วางบิล_${thaiMonthLabel(year, month - 1)}.xlsx`);
}
