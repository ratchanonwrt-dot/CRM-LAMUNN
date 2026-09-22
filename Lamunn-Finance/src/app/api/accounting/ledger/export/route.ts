import { NextRequest, NextResponse } from "next/server";
import { requireSectionApi } from "@/lib/permissions";
import { monthRange } from "@/lib/dates";
import { getAllSettings } from "@/lib/settings";
import { buildLedgerWorkbook, ledgerExcelFilename, loadLedgerExportData } from "@/lib/accounting/ledgerExcel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const staff = await requireSectionApi("ACCOUNTING", "view");
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const year = Number(req.nextUrl.searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(req.nextUrl.searchParams.get("month")) || now.getUTCMonth() + 1;
  const accountId = req.nextUrl.searchParams.get("accountId") || undefined;
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "งวดบัญชีไม่ถูกต้อง" }, { status: 400 });
  }

  const { start, end } = monthRange(year, month - 1);
  const [settings, accounts] = await Promise.all([
    getAllSettings(),
    loadLedgerExportData({ start, end, accountId }),
  ]);
  if (accountId && accounts.length === 0) {
    return NextResponse.json({ error: "ไม่พบบัญชีที่เลือก" }, { status: 404 });
  }

  const workbook = buildLedgerWorkbook(accounts, { companyName: settings.companyName, year, month });
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = ledgerExcelFilename(year, month, accountId ? accounts[0]?.code : undefined);

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
