import { prisma } from "./client";
import { POS_SYNC_START_DATE } from "./posSync";
import { runWithConcurrency } from "./batch";

// Read-only bridge into "Lamunn IMS" (public.extra_sales_reports), which lives in the
// same Postgres project as this app's own "lamunn_finance" schema. IMS's own submitted
// figures are the master record for E-Commerce from POS_SYNC_START_DATE onward — this
// app only ever reads them and fills its own CompanyChannelDaily row to match, never
// writes back to IMS's tables.
export interface ImsExtraSales {
  date: string; // yyyy-mm-dd
  tiktok: number;
  fbLine: number;
  pickup: number;
  catering: number;
}

export async function getImsExtraSales(start: Date, end: Date): Promise<Map<string, ImsExtraSales>> {
  const raw = await prisma.$queryRaw<
    { report_date: string; tiktok_shop_amount: unknown; facebook_line_amount: unknown; pickup_amount: unknown; catering_amount: unknown }[]
  >`
    SELECT report_date::text, tiktok_shop_amount, facebook_line_amount, pickup_amount, catering_amount
    FROM public.extra_sales_reports
    WHERE report_date >= ${start}::date AND report_date <= ${end}::date
  `;

  const map = new Map<string, ImsExtraSales>();
  for (const row of raw) {
    map.set(row.report_date, {
      date: row.report_date,
      tiktok: Number(row.tiktok_shop_amount ?? 0),
      fbLine: Number(row.facebook_line_amount ?? 0),
      pickup: Number(row.pickup_amount ?? 0),
      catering: Number(row.catering_amount ?? 0),
    });
  }
  return map;
}

type ExistingChannelRow = {
  tiktokOverride: boolean;
  fbLineOverride: boolean;
  pickupOverride: boolean;
  cateringOverride: boolean;
  tiktok: number;
  fbLine: number;
  pickup: number;
  catering: number;
};

// Builds the tiktok/fbLine/pickup/catering fields to write, skipping any that the existing
// row has flagged as manually overridden, AND any that already match the stored value (so
// an unchanged day costs zero writes on repeat page loads).
function buildSyncedData(ims: { tiktok: number; fbLine: number; pickup: number; catering: number }, existing?: ExistingChannelRow | null) {
  const data: Record<string, number> = {};
  if (!existing?.tiktokOverride && existing?.tiktok !== ims.tiktok) data.tiktok = ims.tiktok;
  if (!existing?.fbLineOverride && existing?.fbLine !== ims.fbLine) data.fbLine = ims.fbLine;
  if (!existing?.pickupOverride && existing?.pickup !== ims.pickup) data.pickup = ims.pickup;
  if (!existing?.cateringOverride && existing?.catering !== ims.catering) data.catering = ims.catering;
  return data;
}

/**
 * Range version of syncCompanyChannelFromIms — one query covers the whole range, so
 * pages showing a month (or a dashboard window) can opportunistically catch up without
 * a separate scheduled job.
 */
export async function syncCompanyChannelFromImsRange(start: Date, end: Date): Promise<number> {
  if (end < POS_SYNC_START_DATE) return 0;
  const effectiveStart = start < POS_SYNC_START_DATE ? POS_SYNC_START_DATE : start;
  const [map, existingRows] = await Promise.all([
    getImsExtraSales(effectiveStart, end),
    prisma.companyChannelDaily.findMany({
      where: { date: { gte: effectiveStart, lte: end } },
      select: {
        date: true,
        tiktokOverride: true,
        fbLineOverride: true,
        pickupOverride: true,
        cateringOverride: true,
        tiktok: true,
        fbLine: true,
        pickup: true,
        catering: true,
      },
    }),
  ]);
  const existingByDate = new Map(existingRows.map((r) => [r.date.toISOString().slice(0, 10), r]));

  const writes: (() => Promise<unknown>)[] = [];
  for (const ims of map.values()) {
    const date = new Date(`${ims.date}T00:00:00.000Z`);
    const existing = existingByDate.get(ims.date);
    const data = buildSyncedData(ims, existing);
    if (Object.keys(data).length === 0) continue;
    writes.push(() =>
      prisma.companyChannelDaily.upsert({
        where: { date },
        update: data,
        create: { date, ...data },
      })
    );
  }
  // จำกัดความพร้อมกัน — เหตุผลเดียวกับใน posSync.ts (กัน connection pool ของ pgbouncer ถูกยิงพร้อมกันเยอะเกิน)
  await runWithConcurrency(writes, 8);
  return writes.length;
}

/**
 * Pulls IMS's E-Commerce submission for `date` (if on/after POS_SYNC_START_DATE) and
 * upserts it into CompanyChannelDaily. No-op if the date is before the cutoff or IMS
 * has no submission for that day — the existing manually-entered row (if any) stays as is.
 */
export async function syncCompanyChannelFromIms(date: Date) {
  if (date < POS_SYNC_START_DATE) return null;
  const map = await getImsExtraSales(date, date);
  const ims = map.get(date.toISOString().slice(0, 10));
  if (!ims) return null;

  const existing = await prisma.companyChannelDaily.findUnique({
    where: { date },
    select: {
      tiktokOverride: true,
      fbLineOverride: true,
      pickupOverride: true,
      cateringOverride: true,
      tiktok: true,
      fbLine: true,
      pickup: true,
      catering: true,
    },
  });
  const data = buildSyncedData(ims, existing);
  if (Object.keys(data).length === 0) return existing;

  return prisma.companyChannelDaily.upsert({
    where: { date },
    update: data,
    create: { date, ...data },
  });
}
