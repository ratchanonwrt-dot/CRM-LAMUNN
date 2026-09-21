/** แปลงตารางรายชื่อผู้ติดต่อจาก Excel เป็นข้อมูลคู่ค้า (ลูกหนี้/เจ้าหนี้)
 *
 * แยกออกมาเป็นไฟล์กลางเพื่อให้ทั้งปุ่มนำเข้าในหน้าเว็บ (api/accounting/partners/import)
 * และการนำเข้าแบบสคริปต์ ใช้ตรรกะเดียวกันเป๊ะ — ไม่งั้นสองทางจะให้ผลต่างกันโดยไม่รู้ตัว
 *
 * รองรับไฟล์ export จาก FlowAccount (หัวตาราง "รายการสมุดรายชื่อ") ซึ่งแยกที่อยู่เป็น 3 บรรทัด
 * + รหัสไปรษณีย์ และใช้คำว่า "ลูกค้า"/"ผู้จำหน่าย" แทน "ลูกหนี้"/"เจ้าหนี้"
 */

export type PartnerType = "DEBTOR" | "CREDITOR";

export interface PartnerImportRow {
  name: string;
  type: PartnerType;
  phone: string | null;
  taxId: string | null;
  address: string | null;
  note: string | null;
  /** true = ในไฟล์ระบุว่าเป็นทั้งลูกค้าและผู้จำหน่าย */
  isBoth: boolean;
}

export interface PartnerImportResult {
  rows: PartnerImportRow[];
  skipped: { row: number; reason: string }[];
  /** หัวคอลัมน์ที่ระบบจับคู่ได้ — เอาไว้แสดงให้ผู้ใช้ตรวจว่าอ่านไฟล์ถูกช่อง */
  mapping: Record<string, string>;
  headerRow: number;
}

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

/** หาคอลัมน์แรกที่หัวตารางเข้าเงื่อนไข โดยไล่ตามลำดับความสำคัญที่ให้มา */
function findCol(header: string[], patterns: RegExp[]): number {
  for (const re of patterns) {
    const i = header.findIndex((h) => re.test(h.trim()));
    if (i !== -1) return i;
  }
  return -1;
}

/** หาทุกคอลัมน์ที่เข้าเงื่อนไข (ใช้กับที่อยู่ที่แยกเป็นหลายบรรทัด) */
function findAllCols(header: string[], re: RegExp): number[] {
  return header.map((h, i) => (re.test(h.trim()) ? i : -1)).filter((i) => i !== -1);
}

/** ตีความคำในคอลัมน์ "ประเภท" — ไฟล์จาก FlowAccount ใช้ ลูกค้า/ผู้จำหน่าย ไม่ใช่ ลูกหนี้/เจ้าหนี้ */
export function partnerTypeFromText(text: string): { type: PartnerType | null; isBoth: boolean } {
  const s = text.trim().toLowerCase();
  if (!s) return { type: null, isBoth: false };

  const isDebtor = /ลูกหนี้|ลูกค้า|debtor|customer|client/.test(s);
  const isCreditor = /เจ้าหนี้|ผู้จำหน่าย|ผู้ขาย|ซัพพลายเออร์|supplier|vendor|creditor/.test(s);

  if (isDebtor && isCreditor) return { type: "CREDITOR", isBoth: true };
  if (isDebtor) return { type: "DEBTOR", isBoth: false };
  if (isCreditor) return { type: "CREDITOR", isBoth: false };
  return { type: null, isBoth: false };
}

export function mapPartnerGrid(grid: string[][]): PartnerImportResult {
  // หาแถวหัวตาราง — บางไฟล์มีบรรทัดชื่อรายงานอยู่บนสุดก่อนหัวจริง
  let headerRow = -1;
  let header: string[] = [];
  for (let r = 0; r < Math.min(grid.length, 10); r++) {
    const row = grid[r] ?? [];
    // ถือว่าเป็นหัวตารางเมื่อมีช่องที่พูดถึง "ชื่อ" และไม่ใช่บรรทัดที่ทุกช่องเหมือนกันหมด (ชื่อรายงานที่ merge ไว้)
    const hasName = row.some((c) => /ชื่อ|name/i.test(c));
    const allSame = row.filter(Boolean).length > 1 && new Set(row.filter(Boolean)).size === 1;
    if (hasName && !allSame) {
      headerRow = r;
      header = row;
      break;
    }
  }
  if (headerRow === -1) {
    return { rows: [], skipped: [{ row: 1, reason: "หาแถวหัวตารางไม่เจอ — ต้องมีคอลัมน์ชื่อ" }], mapping: {}, headerRow: -1 };
  }

  // ลำดับความสำคัญสำคัญมาก: ไฟล์นี้มีทั้ง "ชื่อธุรกิจ/ชื่อบุคคล", "ชื่อผู้ติดต่อ" และ "ชื่อบัญชี"
  // ต้องเลือกช่องแรกให้ได้ ไม่งั้นจะได้ชื่อคนติดต่อหรือชื่อบัญชีธนาคารมาเป็นชื่อคู่ค้า
  const nameCol = findCol(header, [/^ชื่อธุรกิจ/, /ชื่อธุรกิจ|ชื่อบุคคล/, /^ชื่อ$/, /^name$/i, /ชื่อ/]);
  // "ประเภท" เฉย ๆ คือลูกค้า/ผู้จำหน่าย ส่วน "ประเภทผู้ติดต่อ" คือนิติบุคคล/บุคคลธรรมดา — คนละเรื่อง
  const typeCol = findCol(header, [/^ประเภท$/, /^type$/i, /^ประเภทผู้ติดต่อ$/]);
  const phoneCol = findCol(header, [/^เบอร์มือถือ$/, /มือถือ|^mobile/i, /^เบอร์สำนักงาน$/, /เบอร์|โทร|^phone|^tel/i]);
  const taxIdCol = findCol(header, [/เลขผู้เสียภาษี|เลขภาษี/, /^tax/i]);
  const noteCol = findCol(header, [/^หมายเหตุ$/, /^note$/i]);

  const addressCols = findAllCols(header, /^ที่อยู่/);
  const postCol = findCol(header, [/รหัสไปรษณีย์/, /^zip|^postcode/i]);
  const branchCol = findCol(header, [/^สำนักงาน\/สาขา$/, /สำนักงาน\/สาขา/]);
  const contactCol = findCol(header, [/^ชื่อผู้ติดต่อ$/]);
  const emailCol = findCol(header, [/^อีเมล$/, /^e-?mail$/i]);
  const creditDaysCol = findCol(header, [/เครดิต/]);

  const mapping: Record<string, string> = {};
  const label = (i: number) => (i >= 0 ? header[i] : "");
  if (nameCol >= 0) mapping["ชื่อ"] = label(nameCol);
  if (typeCol >= 0) mapping["ประเภท (ลูกหนี้/เจ้าหนี้)"] = label(typeCol);
  if (phoneCol >= 0) mapping["เบอร์โทร"] = label(phoneCol);
  if (taxIdCol >= 0) mapping["เลขผู้เสียภาษี"] = label(taxIdCol);
  if (addressCols.length) mapping["ที่อยู่"] = addressCols.map(label).join(" + ") + (postCol >= 0 ? ` + ${label(postCol)}` : "");
  const noteParts = [branchCol, contactCol, emailCol, creditDaysCol, noteCol].filter((i) => i >= 0).map(label);
  if (noteParts.length) mapping["หมายเหตุ"] = noteParts.join(" + ");

  const rows: PartnerImportRow[] = [];
  const skipped: { row: number; reason: string }[] = [];

  for (let r = headerRow + 1; r < grid.length; r++) {
    const cells = grid[r] ?? [];
    if (cells.every((c) => !c || !c.trim())) continue;

    const get = (i: number) => (i >= 0 ? (cells[i] ?? "").trim() : "");
    const name = get(nameCol);
    if (!name) {
      skipped.push({ row: r + 1, reason: "ไม่มีชื่อ" });
      continue;
    }

    // ไม่ระบุประเภท = เจ้าหนี้ เพราะระบบใช้คู่ค้าฝั่งจ่ายเงินเป็นหลัก (ใบกำกับซื้อ/หัก ณ ที่จ่าย)
    const parsed = partnerTypeFromText(get(typeCol));
    const type = parsed.type ?? "CREDITOR";

    const address =
      [...addressCols.map(get), get(postCol)]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ") || null;

    const notes: string[] = [];
    if (parsed.isBoth) notes.push("เป็นทั้งลูกค้าและผู้จำหน่าย");
    const branch = get(branchCol);
    if (branch) notes.push(branch);
    const contact = get(contactCol);
    if (contact) notes.push(`ผู้ติดต่อ ${contact}`);
    const email = get(emailCol);
    if (email) notes.push(email);
    const creditDays = get(creditDaysCol);
    if (creditDays && creditDays !== "0") notes.push(`เครดิต ${creditDays} วัน`);
    const rawNote = get(noteCol);
    if (rawNote) notes.push(rawNote);

    // เลขผู้เสียภาษีที่เป็น 0 ทั้ง 13 ตัว = ช่องว่างที่ถูกกรอกหลอกไว้ ไม่ใช่เลขจริง
    const rawTaxId = get(taxIdCol).replace(/\s/g, "");
    const taxId = rawTaxId && !/^0{13}$/.test(rawTaxId) ? rawTaxId : null;

    rows.push({
      name,
      type,
      phone: get(phoneCol) || null,
      taxId,
      address,
      note: notes.length ? notes.join(" · ") : null,
      isBoth: parsed.isBoth,
    });
  }

  return { rows, skipped, mapping, headerRow: headerRow + 1 };
}

/** รวมแถวที่ชื่อซ้ำกันในไฟล์เดียวกันให้เหลือรายการเดียว
 *
 * สมุดรายชื่อมักมีชื่อเดิมซ้ำหลายแถว (คนละสาขา หรือแยกแถวลูกค้า/ผู้จำหน่าย)
 * ถ้าปล่อยให้แถวท้ายทับแถวแรกดื้อ ๆ ข้อมูลที่กรอกไว้ในแถวก่อนหน้าจะหายไปเปล่า ๆ
 * ตรงนี้จึงรวมแบบ "ช่องไหนว่างค่อยเติมจากแถวถัดไป" และถ้าเจอทั้งลูกค้าและผู้จำหน่าย
 * ให้ถือเป็นเจ้าหนี้พร้อมหมายเหตุกำกับ (ตารางคู่ค้าเก็บประเภทได้ค่าเดียว) */
export function mergeDuplicatePartners(rows: PartnerImportRow[]): { merged: PartnerImportRow[]; mergedCount: number } {
  const byName = new Map<string, PartnerImportRow>();
  let mergedCount = 0;

  for (const row of rows) {
    const key = norm(row.name);
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, { ...row });
      continue;
    }
    mergedCount++;

    const isBoth = prev.isBoth || row.isBoth || prev.type !== row.type;
    const notes = new Set<string>();
    if (isBoth) notes.add("เป็นทั้งลูกค้าและผู้จำหน่าย");
    for (const n of [prev.note, row.note]) {
      for (const part of (n ?? "").split(" · ")) {
        const t = part.trim();
        if (t && t !== "เป็นทั้งลูกค้าและผู้จำหน่าย") notes.add(t);
      }
    }

    byName.set(key, {
      name: prev.name,
      type: isBoth ? "CREDITOR" : prev.type,
      phone: prev.phone ?? row.phone,
      taxId: prev.taxId ?? row.taxId,
      address: prev.address ?? row.address,
      note: notes.size ? [...notes].join(" · ") : null,
      isBoth,
    });
  }

  return { merged: [...byName.values()], mergedCount };
}

export { norm as normalizePartnerName };
