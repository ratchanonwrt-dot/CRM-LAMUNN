import { prisma } from "@lamunn/db-finance";
import { SYSTEM_ACCOUNTS } from "./chartOfAccounts";
import { splitVatInclusive, toSatang } from "./money";
import { AccountingError, createEntry, type DraftLine } from "./post";
import { CHANNELS, CHANNEL_LABELS } from "./channels";

/** ลงบัญชียอดขายรายวันจากตัวเลขที่หน้าร้านคีย์ไว้แล้วใน "ยอดขายรายวัน (รายเดือน)"
 *
 * ═══ ปัญหาที่ไฟล์นี้แก้ ═══
 * ยอดขายรายวันถูกบันทึกเป็น "ยอดรวม" (ออกใบกำกับภาษีอย่างย่อหน้าเครื่อง POS)
 * พอมีลูกค้าบางรายมาขอใบกำกับภาษีเต็มรูปทีหลัง แล้วเราออกใบให้
 * ถ้าบันทึกใบนั้นเป็นรายได้อีกใบ ยอดจะถูกนับสองรอบ — ซึ่งคือปัญหาที่เจอใน FlowAccount
 *
 * วิธีที่ระบบนี้ใช้: รายได้ลงบัญชีจาก "ยอดขายรวมของวัน" ครั้งเดียวเท่านั้น
 * ใบกำกับเต็มรูปที่ออกจากบิลในวันนั้น (deductFromBulk = true) ไม่สร้างรายการบัญชีซ้ำ
 * แต่จะถูกใช้แยกยอดในรายงานภาษีขายว่าส่วนไหนเป็นใบกำกับเต็มรูป ส่วนไหนเป็นอย่างย่อ
 *
 * ใบกำกับที่ขายนอกระบบ POS (deductFromBulk = false) ไม่ได้อยู่ในยอดรวม
 * จึงต้องลงบัญชีของตัวเองแยก (ดู postTaxInvoice)
 */

export { CHANNELS, CHANNEL_LABELS } from "./channels";

export interface ChannelAmount {
  channel: string;
  label: string;
  /** ยอดขายรวม VAT ของช่องทางนี้ (สตางค์) */
  gross: number;
  /** ส่วนที่ออกใบกำกับภาษีเต็มรูปให้ลูกค้าไปแล้ว — อยู่ในยอด gross อยู่แล้ว ไม่ได้บวกเพิ่ม */
  fullTaxInvoice: number;
  /** จำนวนใบกำกับเต็มรูปของช่องทางนี้ */
  fullTaxInvoiceCount: number;
  /** บัญชีเดบิต (ปลายทางของเงิน) */
  debitAccount: string;
  /** บัญชีรายได้ */
  revenueAccount: string;
}

export interface DailySalesPreview {
  date: Date;
  vatRate: number;
  channels: ChannelAmount[];
  totalGross: number;
  totalFullTaxInvoice: number;
  /** ยอดที่เหลือซึ่งถือเป็นใบกำกับภาษีอย่างย่อ = totalGross - totalFullTaxInvoice */
  totalAbbreviated: number;
  totalBase: number;
  totalVat: number;
  /** ใบสำคัญที่ลงบัญชีวันนี้ไปแล้ว (ถ้ามี) — กันลงซ้ำ */
  existingEntry: { id: string; entryNo: string; status: string } | null;
}

/** รวมยอดขายของวันหนึ่งจากทุกช่องทาง พร้อมแยกว่าส่วนไหนออกใบกำกับเต็มรูปไปแล้ว */
export async function previewDailySales(date: Date, vatRate: number): Promise<DailySalesPreview> {
  const [salesRows, companyRow, taxInvoices, existingEntry] = await Promise.all([
    prisma.dailySales.findMany({
      where: { date },
      include: { branch: { select: { id: true, type: true } } },
    }),
    prisma.companyChannelDaily.findUnique({ where: { date } }),
    prisma.accTaxInvoice.findMany({
      where: { saleDate: date, deductFromBulk: true, voided: false },
      select: { channel: true, totalAmount: true },
    }),
    prisma.accJournalEntry.findUnique({
      where: { sourceType_sourceKey: { sourceType: "DAILY_SALES", sourceKey: dateKey(date) } },
      select: { id: true, entryNo: true, status: true },
    }),
  ]);

  // ยอดหน้าร้านแยกตามชนิดสาขา — สาขาเงินสดเงินเข้ามือ/เข้าบัญชีเอง
  // สาขา Credit Term ห้างเก็บเงินแทนแล้วโอนทีหลัง จึงเป็นลูกหนี้การค้า ไม่ใช่เงินสด
  let cashSatang = 0;
  let bankSatang = 0;
  let mallReceivableSatang = 0;
  let grabSatang = 0;
  let linemanSatang = 0;

  for (const r of salesRows) {
    if (r.branch.type === "CASH") {
      cashSatang += toSatang(r.cashCounted ?? r.cashPos ?? 0);
      bankSatang += toSatang(r.transfer ?? 0);
    } else {
      mallReceivableSatang += toSatang(r.cashTransferCombined ?? 0);
    }
    grabSatang += toSatang(r.grab);
    linemanSatang += toSatang(r.lineman);
  }

  const storefrontGross = cashSatang + bankSatang + mallReceivableSatang;

  const invoiceByChannel = new Map<string, { amount: number; count: number }>();
  for (const inv of taxInvoices) {
    const cur = invoiceByChannel.get(inv.channel) ?? { amount: 0, count: 0 };
    cur.amount += toSatang(inv.totalAmount);
    cur.count += 1;
    invoiceByChannel.set(inv.channel, cur);
  }

  const raw: Array<Omit<ChannelAmount, "label" | "fullTaxInvoice" | "fullTaxInvoiceCount">> = [
    {
      channel: CHANNELS.STOREFRONT,
      gross: storefrontGross,
      debitAccount: SYSTEM_ACCOUNTS.CASH, // แยกเป็นหลายบัญชีตอนสร้างบรรทัดจริง
      revenueAccount: SYSTEM_ACCOUNTS.REV_STOREFRONT,
    },
    { channel: CHANNELS.GRAB, gross: grabSatang, debitAccount: SYSTEM_ACCOUNTS.AR_GRAB, revenueAccount: SYSTEM_ACCOUNTS.REV_DELIVERY },
    { channel: CHANNELS.LINEMAN, gross: linemanSatang, debitAccount: SYSTEM_ACCOUNTS.AR_LINEMAN, revenueAccount: SYSTEM_ACCOUNTS.REV_DELIVERY },
    { channel: CHANNELS.TIKTOK, gross: toSatang(companyRow?.tiktok ?? 0), debitAccount: SYSTEM_ACCOUNTS.AR_ONLINE, revenueAccount: SYSTEM_ACCOUNTS.REV_ONLINE },
    { channel: CHANNELS.FB_LINE, gross: toSatang(companyRow?.fbLine ?? 0), debitAccount: SYSTEM_ACCOUNTS.AR_ONLINE, revenueAccount: SYSTEM_ACCOUNTS.REV_ONLINE },
    { channel: CHANNELS.PICKUP, gross: toSatang(companyRow?.pickup ?? 0), debitAccount: SYSTEM_ACCOUNTS.CASH, revenueAccount: SYSTEM_ACCOUNTS.REV_ONLINE },
    { channel: CHANNELS.CATERING, gross: toSatang(companyRow?.catering ?? 0), debitAccount: SYSTEM_ACCOUNTS.AR_ONLINE, revenueAccount: SYSTEM_ACCOUNTS.REV_CATERING },
  ];

  const channels: ChannelAmount[] = raw.map((c) => {
    const inv = invoiceByChannel.get(c.channel) ?? { amount: 0, count: 0 };
    return { ...c, label: CHANNEL_LABELS[c.channel], fullTaxInvoice: inv.amount, fullTaxInvoiceCount: inv.count };
  });

  const totalGross = channels.reduce((s, c) => s + c.gross, 0);
  const totalFullTaxInvoice = channels.reduce((s, c) => s + c.fullTaxInvoice, 0);
  const { base, vat } = splitVatInclusive(totalGross, vatRate);

  return {
    date,
    vatRate,
    channels,
    totalGross,
    totalFullTaxInvoice,
    totalAbbreviated: totalGross - totalFullTaxInvoice,
    totalBase: base,
    totalVat: vat,
    existingEntry,
  };
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** สร้างใบสำคัญขายของวันนั้น (สถานะร่าง) จากยอดที่ preview ไว้
 *
 * รายได้ถูกลงครั้งเดียวจากยอดรวมของวัน — ใบกำกับเต็มรูปที่ออกจากบิลวันนั้นไม่ลงซ้ำ
 * (ยอดของมันรวมอยู่ในนี้แล้ว ดูหมายเหตุหัวไฟล์) */
export async function postDailySales(date: Date, vatRate: number, userId?: string | null) {
  const preview = await previewDailySales(date, vatRate);
  if (preview.existingEntry) {
    throw new AccountingError(
      `ยอดขายวันที่ ${dateKey(date)} ลงบัญชีไปแล้วในใบสำคัญ ${preview.existingEntry.entryNo} — ถ้าตัวเลขเปลี่ยน ให้ยกเลิกใบเดิมก่อนแล้วลงใหม่`
    );
  }
  if (preview.totalGross === 0) throw new AccountingError(`วันที่ ${dateKey(date)} ยังไม่มียอดขาย ไม่มีอะไรให้ลงบัญชี`);

  const codes = new Set<string>([
    SYSTEM_ACCOUNTS.CASH,
    SYSTEM_ACCOUNTS.BANK,
    SYSTEM_ACCOUNTS.AR_MALL,
    SYSTEM_ACCOUNTS.OUTPUT_VAT,
    ...preview.channels.map((c) => c.debitAccount),
    ...preview.channels.map((c) => c.revenueAccount),
  ]);
  const accounts = await prisma.accAccount.findMany({ where: { code: { in: [...codes] } } });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));

  function accountId(code: string): string {
    const id = byCode.get(code);
    if (!id) throw new AccountingError(`ไม่พบบัญชีรหัส ${code} ในผังบัญชี — ติดตั้งผังบัญชีเริ่มต้นหรือเพิ่มบัญชีนี้ก่อน`);
    return id;
  }

  // ฝั่งเดบิต: เงินเข้าที่ไหนบ้าง
  const salesRows = await prisma.dailySales.findMany({ where: { date }, include: { branch: { select: { type: true } } } });
  let cash = 0;
  let bank = 0;
  let mall = 0;
  for (const r of salesRows) {
    if (r.branch.type === "CASH") {
      cash += toSatang(r.cashCounted ?? r.cashPos ?? 0);
      bank += toSatang(r.transfer ?? 0);
    } else {
      mall += toSatang(r.cashTransferCombined ?? 0);
    }
  }

  const lines: DraftLine[] = [];
  const push = (code: string, side: "debit" | "credit", satang: number, memo: string, channel?: string) => {
    if (satang === 0) return;
    lines.push({ accountId: accountId(code), [side]: satang / 100, memo, channel: channel ?? null } as DraftLine);
  };

  push(SYSTEM_ACCOUNTS.CASH, "debit", cash, "เงินสดหน้าร้าน", CHANNELS.STOREFRONT);
  push(SYSTEM_ACCOUNTS.BANK, "debit", bank, "เงินโอนหน้าร้าน", CHANNELS.STOREFRONT);
  push(SYSTEM_ACCOUNTS.AR_MALL, "debit", mall, "ยอดขายผ่านห้าง (รอห้างโอน)", CHANNELS.STOREFRONT);

  for (const c of preview.channels) {
    if (c.channel === CHANNELS.STOREFRONT) continue; // ลงฝั่งเดบิตไปแล้วด้านบน
    push(c.debitAccount, "debit", c.gross, c.label, c.channel);
  }

  // ฝั่งเครดิต: รายได้แยกตามบัญชี + ภาษีขาย
  // แยก VAT ทีละบัญชีรายได้ แล้วให้บรรทัดสุดท้ายรับเศษ เพื่อให้ผลรวมตรงกับยอดรวมของวันเป๊ะ
  const revenueTotals = new Map<string, { gross: number; channels: string[] }>();
  for (const c of preview.channels) {
    if (c.gross === 0) continue;
    const cur = revenueTotals.get(c.revenueAccount) ?? { gross: 0, channels: [] };
    cur.gross += c.gross;
    cur.channels.push(c.label);
    revenueTotals.set(c.revenueAccount, cur);
  }

  let vatAccumulated = 0;
  const revenueEntries = [...revenueTotals.entries()];
  revenueEntries.forEach(([code, v], i) => {
    const isLast = i === revenueEntries.length - 1;
    const split = splitVatInclusive(v.gross, vatRate);
    const vat = isLast ? preview.totalVat - vatAccumulated : split.vat;
    vatAccumulated += vat;
    push(code, "credit", v.gross - vat, v.channels.join(", "));
  });

  push(SYSTEM_ACCOUNTS.OUTPUT_VAT, "credit", preview.totalVat, `ภาษีขาย ${(vatRate * 100).toFixed(0)}%`);

  const abbreviated = preview.totalAbbreviated;
  const description =
    preview.totalFullTaxInvoice > 0
      ? `ขายประจำวันที่ ${dateKey(date)} (ใบกำกับอย่างย่อ ${(abbreviated / 100).toLocaleString("th-TH")} + ใบกำกับเต็มรูป ${(preview.totalFullTaxInvoice / 100).toLocaleString("th-TH")})`
      : `ขายประจำวันที่ ${dateKey(date)}`;

  return createEntry({
    date,
    journalType: "SALES",
    description,
    sourceType: "DAILY_SALES",
    sourceKey: dateKey(date),
    lines,
    userId,
  });
}

/** ลงบัญชีใบกำกับภาษีเต็มรูปที่ "ไม่ได้" อยู่ในยอดขายรวม (deductFromBulk = false)
 * ใบที่อยู่ในยอดรวมอยู่แล้วจะไม่มีรายการบัญชีของตัวเอง เพื่อไม่ให้รายได้ซ้ำ */
export async function postTaxInvoice(invoiceId: string, userId?: string | null) {
  const inv = await prisma.accTaxInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv) throw new AccountingError("ไม่พบใบกำกับภาษีนี้");
  if (inv.voided) throw new AccountingError("ใบกำกับนี้ถูกยกเลิกแล้ว");
  if (inv.deductFromBulk) {
    throw new AccountingError(
      "ใบกำกับใบนี้ออกจากบิลที่อยู่ในยอดขายรวมของวันอยู่แล้ว จึงไม่ต้องลงบัญชีซ้ำ — ยอดถูกบันทึกไปพร้อมใบสำคัญขายประจำวันแล้ว"
    );
  }

  const accounts = await prisma.accAccount.findMany({
    where: { code: { in: [SYSTEM_ACCOUNTS.AR_ONLINE, SYSTEM_ACCOUNTS.REV_STOREFRONT, SYSTEM_ACCOUNTS.OUTPUT_VAT] } },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.id]));
  const need = (code: string) => {
    const id = byCode.get(code);
    if (!id) throw new AccountingError(`ไม่พบบัญชีรหัส ${code} ในผังบัญชี`);
    return id;
  };

  return createEntry({
    date: inv.issueDate,
    journalType: "SALES",
    description: `ใบกำกับภาษี ${inv.docNo} — ${inv.customerName}`,
    sourceType: "TAX_INVOICE",
    sourceKey: inv.id,
    userId,
    lines: [
      { accountId: need(SYSTEM_ACCOUNTS.AR_ONLINE), debit: Number(inv.totalAmount), branchId: inv.branchId, memo: inv.customerName },
      { accountId: need(SYSTEM_ACCOUNTS.REV_STOREFRONT), credit: Number(inv.baseAmount), branchId: inv.branchId, memo: inv.description },
      { accountId: need(SYSTEM_ACCOUNTS.OUTPUT_VAT), credit: Number(inv.vatAmount), memo: `ภาษีขาย ${inv.docNo}` },
    ],
  });
}

// ────────────────────────── มุมมองรายเดือน (สำหรับหน้าลงบัญชี) ──────────────────────────

export interface DailySalesRow {
  dateKey: string;
  gross: number;
  fullTaxInvoice: number;
  fullTaxInvoiceCount: number;
  abbreviated: number;
  vat: number;
  entryNo: string | null;
  entryStatus: string | null;
}

/** สรุปยอดขายทุกวันในเดือนพร้อมสถานะการลงบัญชี — ใช้ 4 คิวรีต่อเดือน ไม่ใช่ต่อวัน
 * คอลัมน์ "ออกใบกำกับเต็มรูปแล้ว" คือส่วนที่รวมอยู่ในยอดขายรวมของวันนั้นอยู่แล้ว
 * ไม่ได้บวกเพิ่ม — มีไว้ให้เห็นชัดว่าไม่ได้นับซ้ำ และใช้แยกยอดในรายงานภาษีขาย */
export async function previewDailySalesMonth(start: Date, end: Date, vatRate: number): Promise<DailySalesRow[]> {
  const [salesRows, companyRows, invoices, entries] = await Promise.all([
    prisma.dailySales.findMany({
      where: { date: { gte: start, lte: end } },
      include: { branch: { select: { type: true } } },
    }),
    prisma.companyChannelDaily.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.accTaxInvoice.findMany({
      where: { saleDate: { gte: start, lte: end }, deductFromBulk: true, voided: false },
      select: { saleDate: true, totalAmount: true },
    }),
    prisma.accJournalEntry.findMany({
      where: { sourceType: "DAILY_SALES", date: { gte: start, lte: end } },
      select: { sourceKey: true, entryNo: true, status: true },
    }),
  ]);

  const gross = new Map<string, number>();
  const add = (key: string, satang: number) => gross.set(key, (gross.get(key) ?? 0) + satang);

  for (const r of salesRows) {
    const key = dateKey(r.date);
    if (r.branch.type === "CASH") {
      add(key, toSatang(r.cashCounted ?? r.cashPos ?? 0) + toSatang(r.transfer ?? 0));
    } else {
      add(key, toSatang(r.cashTransferCombined ?? 0));
    }
    add(key, toSatang(r.grab) + toSatang(r.lineman));
  }
  for (const c of companyRows) {
    add(dateKey(c.date), toSatang(c.tiktok) + toSatang(c.fbLine) + toSatang(c.pickup) + toSatang(c.catering));
  }

  const invByDate = new Map<string, { amount: number; count: number }>();
  for (const inv of invoices) {
    const key = dateKey(inv.saleDate);
    const cur = invByDate.get(key) ?? { amount: 0, count: 0 };
    cur.amount += toSatang(inv.totalAmount);
    cur.count += 1;
    invByDate.set(key, cur);
  }

  const entryByDate = new Map(entries.map((e) => [e.sourceKey ?? "", e]));

  const rows: DailySalesRow[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = dateKey(d);
    const g = gross.get(key) ?? 0;
    const inv = invByDate.get(key) ?? { amount: 0, count: 0 };
    const entry = entryByDate.get(key);
    if (g === 0 && inv.count === 0 && !entry) continue;

    rows.push({
      dateKey: key,
      gross: g,
      fullTaxInvoice: inv.amount,
      fullTaxInvoiceCount: inv.count,
      abbreviated: g - inv.amount,
      vat: splitVatInclusive(g, vatRate).vat,
      entryNo: entry?.entryNo ?? null,
      entryStatus: entry?.status ?? null,
    });
  }

  return rows;
}
