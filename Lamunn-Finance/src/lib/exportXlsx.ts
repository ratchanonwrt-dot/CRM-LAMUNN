import ExcelJS from "exceljs";

export interface ExportSheet {
  name: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, unknown>[];
}

/** สร้างไฟล์ .xlsx จากชีตที่ระบุ แต่ละชีตมีหัวตารางตัวหนา + ปรับความกว้างคอลัมน์อัตโนมัติ */
export async function buildXlsx(sheets: ExportSheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    const ws = workbook.addWorksheet(sheet.name.slice(0, 31));
    ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 18 }));
    ws.getRow(1).font = { bold: true };
    ws.addRows(sheet.rows);
  }
  if (workbook.worksheets.length === 0) {
    const ws = workbook.addWorksheet("ไม่มีข้อมูล");
    ws.addRow(["ไม่มีข้อมูลตามตัวเลือกที่เลือก"]);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function xlsxResponse(buffer: Buffer, filename: string) {
  // ชื่อไฟล์เป็นภาษาไทย ใช้ตรงๆ ใน header ไม่ได้ (ต้องเป็น ByteString) — เข้ารหัสตาม RFC 5987
  // พร้อม fallback ชื่อภาษาอังกฤษไว้เผื่อ client เก่าไม่รองรับ filename*=
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
