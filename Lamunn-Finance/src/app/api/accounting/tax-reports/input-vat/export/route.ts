import { NextRequest, NextResponse } from "next/server";
import { requireSectionApi } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { buildInputVatReport } from "@/lib/accounting/taxReports";
import { buildInputVatWorkbook, inputVatExcelFilename } from "@/lib/accounting/inputVatExcel";

export const dynamic = "force-dynamic";

/** ดาวน์โหลดรายงานภาษีซื้อของเดือนเป็น Excel — ข้อมูลชุดเดียวกับหน้าจอเป๊ะ (ใช้ buildInputVatReport ตัวเดียวกัน) */
export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const year = Number(req.nextUrl.searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(req.nextUrl.searchParams.get("month")) || now.getUTCMonth() + 1;
  if (month < 1 || month > 12) return NextResponse.json({ error: "เดือนไม่ถูกต้อง" }, { status: 400 });
  const { start, end } = monthRange(year, month - 1);

  const [settings, report] = await Promise.all([getAllSettings(), buildInputVatReport(start, end)]);
  const wb = buildInputVatWorkbook(report, {
    companyName: settings.companyName,
    companyTaxId: settings.companyTaxId,
    companyAddress: settings.companyAddress,
    year,
    month,
  });
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${inputVatExcelFilename(year, month)}"`,
      "Cache-Control": "no-store",
    },
  });
}
