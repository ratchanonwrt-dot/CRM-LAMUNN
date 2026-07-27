import { prisma } from "@lamunn/db-finance";

const DEFAULTS: Record<string, string> = {
  grabFeePercent: "0.23",
  grabFeeVatPercent: "0.07",
  linemanFeePercent: "0.15",
  cashOpeningBalance: "0",
  cashOpeningDate: "1970-01-01",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getSettingNumber(key: string): Promise<number> {
  return Number(await getSetting(key));
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULTS, ...map };
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
