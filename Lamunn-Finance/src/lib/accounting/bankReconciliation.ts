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
  matchKind: "same-date" | "near-date" | null;
  daysApart: number | null;
};

type ColumnMap = {
  date: number;
  details: number[];
  amount?: number;
  debit?: number;
  credit?: number;
  deposit?: number;
  withdrawal?: number;
};

const DATE_HEADERS = ["date", "transactiondate", "postingdate", "วันที่", "วันเดือนปี"];
const DETAIL_HEADERS = [
  "description", "detail", "details", "particular", "particulars", "memo", "partner", "vendor", "customer",
  "รายการ", "รายละเอียด", "คำอธิบาย", "คู่ค้า", "สาขาคู่ค้า",
];
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

function headerMatches(header: string, aliases: string[]): boolean {
  return aliases.includes(header) || aliases.some((alias) => alias.length >= 4 && header.includes(alias));
}

function findColumn(headers: string[], aliases: string[]): number | undefined {
  const exactIndex = headers.findIndex((header) => aliases.includes(header));
  if (exactIndex >= 0) return exactIndex;
  // คำย่ออย่าง CR/DR ห้ามค้นแบบบางส่วน เพราะจะไปชนกับ Description หรือหัวคอลัมน์อื่น
  const index = headers.findIndex((header) => aliases.some((alias) => alias.length >= 4 && header.includes(alias)));
  return index >= 0 ? index : undefined;
}

function findColumns(headers: string[], aliases: string[]): number[] {
  return headers.flatMap((header, index) => headerMatches(header, aliases) ? [index] : []);
}

function detectColumns(row: unknown[]): ColumnMap | null {
  // ExcelJS คืนแถวที่มีเซลล์ว่างเป็น sparse array จึงต้องเติมช่องว่างก่อนเรียก string methods
  const headers = Array.from({ length: row.length }, (_, index) => normalizeHeader(row[index]));
  const date = findColumn(headers, DATE_HEADERS);
  if (date === undefined) return null;

  const map: ColumnMap = {
    date,
    details: findColumns(headers, DETAIL_HEADERS),
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
      detail: [...new Set(columns.details.map((column) => String(row[column] ?? "").trim()).filter(Boolean))].join(" — "),
      amount,
    });
  }
  return items;
}

const GENERIC_DETAIL_WORDS = new Set([
  "โอนเงิน", "รับโอนเงิน", "จ่าย", "รับ", "โอนไป", "โอนจาก", "วันที่", "บริษัท", "บจ", "จำกัด",
  "นางสาว", "นส", "นาย", "ค่าจ้าง", "ไลฟ์", "ขายสินค้า", "หัก", "ณ", "ที่จ่าย",
]);

function detailTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/\+{2,}/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !GENERIC_DETAIL_WORDS.has(token) && !/^x\d+$/i.test(token));
}

function detailSimilarity(left: string, right: string): number {
  const leftTokens = detailTokens(left);
  const rightTokens = detailTokens(right);
  if (!leftTokens.length || !rightTokens.length) return 0;
  const matched = leftTokens.filter((leftToken) => rightTokens.some((rightToken) => (
    leftToken === rightToken
    || (Math.min(leftToken.length, rightToken.length) >= 4 && (leftToken.startsWith(rightToken) || rightToken.startsWith(leftToken)))
  ))).length;
  return Math.round((matched / Math.min(leftTokens.length, rightTokens.length)) * 100);
}

function daysBetween(left: string, right: string): number {
  return Math.round(Math.abs(Date.parse(left) - Date.parse(right)) / 86_400_000);
}

export function reconcileBankRows(bankRows: ReconciliationItem[], ledgerRows: ReconciliationItem[]): ReconciliationResultRow[] {
  const candidates: Array<{ bankIndex: number; ledgerIndex: number; daysApart: number; score: number }> = [];
  for (let bankIndex = 0; bankIndex < bankRows.length; bankIndex++) {
    for (let ledgerIndex = 0; ledgerIndex < ledgerRows.length; ledgerIndex++) {
      const bank = bankRows[bankIndex];
      const ledger = ledgerRows[ledgerIndex];
      if (bank.amount !== ledger.amount) continue;
      const daysApart = daysBetween(bank.dateKey, ledger.dateKey);
      if (daysApart > 1) continue;
      const similarity = detailSimilarity(bank.detail, ledger.detail);
      // วันที่คลาดเคลื่อนยอมรับเฉพาะเมื่อรายละเอียดช่วยยืนยัน เพื่อไม่จับยอดซ้ำแบบเดาสุ่ม
      if (daysApart === 1 && similarity < 25) continue;
      candidates.push({
        bankIndex,
        ledgerIndex,
        daysApart,
        score: (daysApart === 0 ? 1_000 : 500) + similarity,
      });
    }
  }
  candidates.sort((left, right) => right.score - left.score || left.bankIndex - right.bankIndex || left.ledgerIndex - right.ledgerIndex);

  const usedBank = new Set<number>();
  const usedLedger = new Set<number>();
  const results: ReconciliationResultRow[] = [];
  for (const candidate of candidates) {
    if (usedBank.has(candidate.bankIndex) || usedLedger.has(candidate.ledgerIndex)) continue;
    usedBank.add(candidate.bankIndex);
    usedLedger.add(candidate.ledgerIndex);
    const bank = bankRows[candidate.bankIndex];
    const ledger = ledgerRows[candidate.ledgerIndex];
    results.push({
      id: `bank-${bank.rowNumber}`,
      dateKey: bank.dateKey,
      dateLabel: bank.dateLabel,
      bank,
      ledger,
      matched: true,
      matchKind: candidate.daysApart === 0 ? "same-date" : "near-date",
      daysApart: candidate.daysApart,
    });
  }

  for (let bankIndex = 0; bankIndex < bankRows.length; bankIndex++) {
    if (usedBank.has(bankIndex)) continue;
    const bank = bankRows[bankIndex];
    results.push({ id: `bank-${bank.rowNumber}`, dateKey: bank.dateKey, dateLabel: bank.dateLabel, bank, ledger: null, matched: false, matchKind: null, daysApart: null });
  }
  for (let ledgerIndex = 0; ledgerIndex < ledgerRows.length; ledgerIndex++) {
    if (usedLedger.has(ledgerIndex)) continue;
    const ledger = ledgerRows[ledgerIndex];
    results.push({ id: `ledger-${ledger.rowNumber}`, dateKey: ledger.dateKey, dateLabel: ledger.dateLabel, bank: null, ledger, matched: false, matchKind: null, daysApart: null });
  }

  return results.sort((left, right) => left.dateKey.localeCompare(right.dateKey) || left.id.localeCompare(right.id));
}

export function reconciliationAmountLabel(item: ReconciliationItem | null): string {
  return item ? fmtSatang(item.amount, { zeroDash: false }) : "—";
}
