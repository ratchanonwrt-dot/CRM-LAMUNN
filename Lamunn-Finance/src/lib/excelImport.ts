import ExcelJS from "exceljs";

/** แปลงค่าเซลล์ (string/number/richText/formula ฯลฯ) ให้เป็นข้อความล้วน */
export function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim();
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text).trim();
  }
  return String(v).trim();
}

/** แปลงไฟล์ .xlsx หรือ .csv เป็นตารางข้อความล้วน (แถว x คอลัมน์, index เริ่ม 0) — ใช้ร่วมกันทุกจุดที่นำเข้า Excel */
export async function fileToGrid(file: File): Promise<string[][]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (/\.csv$/i.test(file.name)) {
    return buffer
      .toString("utf8")
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const grid: string[][] = [];
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= Math.min(ws.columnCount, 20); c++) {
      cells.push(cellText(row.getCell(c).value));
    }
    grid.push(cells);
  }
  return grid;
}
