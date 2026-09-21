import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@lamunn/db-finance";

const DEFAULTS: Record<string, string> = {
  grabFeePercent: "0.23",
  grabFeeVatPercent: "0.07",
  linemanFeePercent: "0.15",
  cashOpeningBalance: "0",
  cashOpeningDate: "1970-01-01",
  companyName: "",
  companyAddress: "",
  companyTaxId: "",
  // ระบบบัญชี
  vatRate: "0.07", // อัตราภาษีมูลค่าเพิ่ม — ตั้ง "0" ถ้ายังไม่จด VAT
  fiscalYearStartMonth: "1", // เดือนเริ่มรอบบัญชี (1 = มกราคม)
  taxInvoicePrefix: "INV", // คำนำหน้าเลขที่ใบกำกับภาษีเต็มรูป
};

export const SETTINGS_CACHE_TAG = "settings";

/** ตารางตั้งค่ามีไม่กี่สิบแถวและแทบไม่เคยเปลี่ยน แต่ถูกอ่านเกือบทุกหน้า —
 * แคชไว้ทั้งก้อนแทนการยิง DB ซ้ำทุก request แล้วล้างเมื่อมีการบันทึกที่หน้าตั้งค่าระบบ */
const readSettingRows = unstable_cache(async () => prisma.setting.findMany(), ["settings"], {
  tags: [SETTINGS_CACHE_TAG],
});

/** เรียกหลังบันทึกหน้าตั้งค่าระบบ เพื่อให้ค่าใหม่มีผลทันที */
export function revalidateSettings() {
  revalidateTag(SETTINGS_CACHE_TAG);
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await readSettingRows();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...map };
}

export async function getSetting(key: string): Promise<string> {
  const all = await getAllSettings();
  return all[key] ?? "";
}

export async function getSettingNumber(key: string): Promise<number> {
  return Number(await getSetting(key));
}

/** Grab: หัก GP% + VAT% บนค่า GP นั้น. คืนยอดสุทธิที่ควรเข้าบัญชี */
export function calcGrabNet(grabSales: number, grabFeePercent: number, grabFeeVatPercent: number): number {
  const fee = grabSales * grabFeePercent;
  const feeWithVat = fee * (1 + grabFeeVatPercent);
  return grabSales - feeWithVat;
}

/** Lineman: หัก fee% (รวม VAT แล้ว) คืนยอดสุทธิที่ควรเข้าบัญชี */
export function calcLinemanNet(linemanSales: number, linemanFeePercent: number): number {
  return linemanSales * (1 - linemanFeePercent);
}
