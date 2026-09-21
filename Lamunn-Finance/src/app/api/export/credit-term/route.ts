import { NextRequest } from "next/server";
import { prisma } from "@lamunn/db-finance";
import { requireSectionApi } from "@/lib/permissions";
import { getOutstandingDetail } from "@/lib/creditTermCalc";
import { buildXlsx, xlsxResponse, type ExportSheet } from "@/lib/exportXlsx";
import { formatThaiDate } from "@/lib/format";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("CREDIT_TERM", "view");
  if (!staff) return new Response("unauthorized", { status: 401 });

  const { searchParams } = req.nextUrl;
  const sections = new Set((searchParams.get("sections") ?? "").split(",").filter(Boolean));
  const sheets: ExportSheet[] = [];

  if (sections.has("outstanding")) {
    const outstandingDetail = await getOutstandingDetail();
    sheets.push({
      name: "ยอดค้างห้างรายสาขา",
      columns: [
        { header: "วันครบกำหนด", key: "dueDate", width: 18 },
        { header: "ห้าง / สาขา", key: "branchName", width: 24 },
        { header: "ยอดค้างรอบนี้ (บาท)", key: "netAmount", width: 18 },
        { header: "สถานะ", key: "status", width: 16 },
      ],
      rows: outstandingDetail.map((o) => ({
        dueDate: formatThaiDate(o.dueDate),
        branchName: o.branchName,
        netAmount: o.netAmount,
        status: o.existingId ? "ปิดรอบแล้ว — รอชำระ" : "ยังไม่ปิดรอบ",
      })),
    });
  }

  if (sections.has("history")) {
    const allPayments = await prisma.creditTermPayment.findMany({ include: { branch: true }, orderBy: { dueDate: "desc" } });
    sheets.push({
      name: "ประวัติรอบรับเงิน",
      columns: [
        { header: "สาขา / รายการ", key: "branchName", width: 24 },
        { header: "ช่วงเวลา", key: "period", width: 28 },
        { header: "ยอดที่ต้องรับ", key: "netAmount", width: 16 },
        { header: "ได้รับจริง", key: "receivedAmount", width: 16 },
        { header: "ค้าง/ทบยอด", key: "shortfallAmount", width: 16 },
        { header: "ครบกำหนด", key: "dueDate", width: 18 },
        { header: "สถานะ", key: "status", width: 14 },
      ],
      rows: allPayments.map((p) => ({
        branchName: p.branch?.name ?? p.label ?? "-",
        period: p.periodStart && p.periodEnd ? `${formatThaiDate(p.periodStart)} – ${formatThaiDate(p.periodEnd)}` : p.label ?? "-",
        netAmount: p.netAmount,
        receivedAmount: p.status === "PAID" ? p.receivedAmount ?? p.netAmount : "",
        shortfallAmount: p.shortfallAmount > 0 ? p.shortfallAmount : "",
        dueDate: formatThaiDate(p.dueDate),
        status: p.status === "PAID" ? "รับเงินแล้ว" : "รอชำระ",
      })),
    });
  }

  const buffer = await buildXlsx(sheets);
  return xlsxResponse(buffer, `Credit_Term.xlsx`);
}
