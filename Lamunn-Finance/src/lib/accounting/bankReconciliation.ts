import { fmtSatang } from "./money";

export type ReconciliationSource = "bank" | "ledger";

export type ReconciliationItem = {
  rowNumber: number;
  dateKey: string;
  dateLabel: string;
  detail: string;
  amount: number;
};

export type ReconciliationResultRow = {
  id: string;
  dateKey: string;
  dateLabel: string;
  bank: ReconciliationItem | null;
  ledger: ReconciliationItem | null;
  matched: boolean;
};

type ColumnMap = {
  date: number;
  detail?: number;
  amount?: number;
  debit?: number;
  credit?: number;
  deposit?: number;
  withdrawal?: number;
};

const DATE_HEADERS = ["date", "transactiondate", "postingdate", "วันที่", "วันเดือนปี"];
const DETAIL_HEADERS = ["description", "detail", "details", "particular", "particulars", "memo", "รายการ", "รายละเอียด", "คำอธิบาย"];
const AMOUNT_HEADERS = ["amount", "transactionamount", "ยอดรายการ", "จำนวนเงิน", "ยอดเงิน"];
const DEBIT_HEADERS = ["debit", "dr", "เดบิต"];
const CREDIT_HEADERS = ["credit", "cr", "เครดิต"];
const DEPOSIT_HEADERS = ["deposit", "moneyin", "income", "ฝาก", "เงินเข้า", "รับ"];
const WITHDRAWAL_HEADERS = ["withdrawal", "withdraw", "moneyout", "payment", "ถอน", "เงินออก", "จ่าย"];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_./()\-]+/g, "");
}

function findColumn(headers: string[], aliases: string[]): number | undefined {
  const exactIndex = headers.findIndex((header) => aliases.includes(header));
  if (exactIndex >= 0) return exactIndex;
  // คำย่ออย่าง CR/DR ห้ามค้นแบบบางส่วน เพราะจะไปชนกับ Description หรือหัวคอลัมน์อื่น
  const index = headers.findIndex((header) => aliases.some((alias) => alias.length >= 4 && header.includes(alias)));
  return index >= 0 ? index : undefined;
}

function detectColumns(row: unknown[]): ColumnMap | null {
  // ExcelJS คืนแถวที่มีเซลล์ว่างเป็น sparse array จึงต้องเติมช่องว่างก่อนเรียก string methods
  const headers = Array.from({ length: row.length }, (_, index) => normalizeHeader(row[index]));
  const date = findColumn(headers, DATE_HEADERS);
  if (date === undefined) return null;

  const map: ColumnMap = {
    date,
    detail: findColumn(headers, DETAIL_HEADERS),
    amount: findColumn(headers, AMOUNT_HEADERS),
    debit: findColumn(headers, DEBIT_HEADERS),
    credit: findColumn(headers, CREDIT_HEADERS),
    deposit: findColumn(headers, DEPOSIT_HEADERS),
    withdrawal: findColumn(headers, WITHDRAWAL_HEADERS),
  };

  return map.amount !== undefined
    || map.debit !== undefined
    || map.credit !== undefined
    || map.deposit !== undefined
    || map.withdrawal !== undefined
    ? map
    : null;
}

function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) : null;

  const original = String(value).trim();
  if (!original || original === "-") return null;
  const negative = /^\(.*\)$/.test(original) || /(?:dr|เดบิต)$/i.test(original);
  const cleaned = original.replace(/[(),฿,\s]/g, "").replace(/(?:cr|dr|เครดิต|เดบิต)$/i, "");
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(Math.abs(parsed) * 100) * (negative || parsed < 0 ? -1 : 1);
}

function dateParts(value: unknown): { year: number; month: number; day: number } | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }

  // Excel เก็บวันที่เป็นจำนวนวันนับจากปี 1899 จึงต้องแปลงก่อนเทียบกับวันที่จาก CSV
  if (typeof value === "number" && value > 20_000 && value < 100_000) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  const text = String(value ?? "").trim();
  if (!text) return null;
  const parts = text.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})/);
  if (!parts) return null;

  let year: number;
  let month: number;
  let day: number;
  if (parts[1].length === 4) {
    year = Number(parts[1]);
    month = Number(parts[2]);
    day = Number(parts[3]);
  } else {
    day = Number(parts[1]);
    month = Number(parts[2]);
    year = Number(parts[3]);
  }
  if (year > 2400) year -= 543;
  if (year < 100) year += 2000;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

function parseDate(value: unknown): Pick<ReconciliationItem, "dateKey" | "dateLabel"> | null {
  const parts = dateParts(value);
  if (!parts) return null;
  const dateKey = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  const dateLabel = `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year + 543}`;
  return { dateKey, dateLabel };
}

function amountFromRow(row: unknown[], columns: ColumnMap, source: ReconciliationSource): number | null {
  const direct = columns.amount === undefined ? null : parseMoney(row[columns.amount]);
  if (direct !== null) return direct;

  const deposit = columns.deposit === undefined ? null : parseMoney(row[columns.deposit]);
  const withdrawal = columns.withdrawal === undefined ? null : parseMoney(row[columns.withdrawal]);
  if (deposit !== null && deposit !== 0) return Math.abs(deposit);
  if (withdrawal !== null && withdrawal !== 0) return -Math.abs(withdrawal);
  if (deposit !== null || withdrawal !== null) return 0;

  const debit = columns.debit === undefined ? null : parseMoney(row[columns.debit]);
  const credit = columns.credit === undefined ? null : parseMoney(row[columns.credit]);
  if (source === "bank") {
    if (credit !== null && credit !== 0) return Math.abs(credit);
    if (debit !== null && debit !== 0) return -Math.abs(debit);
  } else {
    if (debit !== null && debit !== 0) return Math.abs(debit);
    if (credit !== null && credit !== 0) return -Math.abs(credit);
  }
  return debit !== null || credit !== null ? 0 : null;
}

export function parseReconciliationTable(table: unknown[][], source: ReconciliationSource): ReconciliationItem[] {
  let headerIndex = -1;
  let columns: ColumnMap | null = null;
  for (let index = 0; index < Math.min(table.length, 20); index++) {
    const detected = detectColumns(table[index]);
    if (detected) {
      headerIndex = index;
      columns = detected;
      break;
    }
  }
  if (!columns) {
    throw new Error("ไม่พบหัวคอลัมน์วันที่และจำนวนเงิน กรุณาใช้คอลัมน์ วันที่ พร้อมกับ จำนวนเงิน หรือ เดบิต/เครดิต");
  }

  const items: ReconciliationItem[] = [];
  for (let index = headerIndex + 1; index < table.length; index++) {
    const row = table[index];
    const date = parseDate(row[columns.date]);
    const amount = amountFromRow(row, columns, source);
    if (!date || amount === null || amount === 0) continue;
    items.push({
      rowNumber: index + 1,
      ...date,
      detail: columns.detail === undefined ? "" : String(row[columns.detail] ?? "").trim(),
      amount,
    });
  }
  return items;
}

export function reconcileBankRows(bankRows: ReconciliationItem[], ledgerRows: ReconciliationItem[]): ReconciliationResultRow[] {
  const ledgerBuckets = new Map<string, ReconciliationItem[]>();
  for (const row of ledgerRows) {
    const key = `${row.dateKey}|${row.amount}`;
    const bucket = ledgerBuckets.get(key) ?? [];
    bucket.push(row);
    ledgerBuckets.set(key, bucket);
  }

  const results: ReconciliationResultRow[] = [];
  for (const bank of bankRows) {
    const key = `${bank.dateKey}|${bank.amount}`;
    const ledger = ledgerBuckets.get(key)?.shift() ?? null;
    results.push({
      id: `bank-${bank.rowNumber}`,
      dateKey: bank.dateKey,
      dateLabel: bank.dateLabel,
      bank,
      ledger,
      matched: Boolean(ledger),
    });
  }

  for (const bucket of ledgerBuckets.values()) {
    for (const ledger of bucket) {
      results.push({
        id: `ledger-${ledger.rowNumber}`,
        dateKey: ledger.dateKey,
        dateLabel: ledger.dateLabel,
        bank: null,
        ledger,
        matched: false,
      });
    }
  }

  return results.sort((left, right) => left.dateKey.localeCompare(right.dateKey) || left.id.localeCompare(right.id));
}

export function reconciliationAmountLabel(item: ReconciliationItem | null): string {
  return item ? fmtSatang(item.amount, { zeroDash: false }) : "—";
}
