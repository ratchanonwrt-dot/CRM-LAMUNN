import { prisma } from "./client";
import { customerDisplayName } from "./customerName";

// How many days back a branch must have a POS bill for its data to be trusted
// enough to actually compare — otherwise a branch on Wongnai (never synced
// here) or one whose sync silently stopped would show as "0 matching bills"
// and get flagged as fraud for a totally unrelated reason.
const POS_SYNC_STALE_DAYS = 3;

export interface FraudCheckRow {
  branchCode: string;
  branchName: string;
  date: string; // yyyy-mm-dd
  rewardName: string;
  discountAmount: number;
  crmConfirmedCount: number;
  posMatchingBillCount: number | null; // null = no comparable POS data (stale/no sync — e.g. Wongnai branch)
  status: "match" | "mismatch" | "no_data";
}

/**
 * Cross-checks free-voucher redemptions (pointsSpent=0, e.g. the welcome
 * coupon or a tier bundle) confirmed in the CRM against the POS's own bills
 * for a matching discount, per branch per day. Only meaningful for branches
 * whose internal POS data actually syncs into this database (see
 * POS_SYNC_STALE_DAYS) — branches on a separate system like Wongnai, or ones
 * whose sync has stopped, show as "no_data" rather than a false mismatch.
 */
export async function getVoucherFraudCheck(options?: { days?: number }): Promise<FraudCheckRow[]> {
  const days = options?.days ?? 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const redemptions = await prisma.redemption.findMany({
    where: {
      status: "COMPLETED",
      pointsSpent: 0,
      updatedAt: { gte: since },
      branchId: { not: null },
      reward: { discountAmount: { not: null } },
    },
    include: { branch: true, reward: true },
  });

  type Group = { branchCode: string; branchName: string; date: string; rewardName: string; discountAmount: number; count: number };
  const groups = new Map<string, Group>();
  for (const r of redemptions) {
    if (!r.branch || !r.reward?.discountAmount) continue;
    const date = r.updatedAt.toISOString().slice(0, 10);
    const discountAmount = Number(r.reward.discountAmount);
    const key = `${r.branch.code}|${date}|${r.rewardName}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { branchCode: r.branch.code, branchName: r.branch.name, date, rewardName: r.rewardName, discountAmount, count: 1 });
  }

  const groupList = [...groups.values()];
  if (groupList.length === 0) return [];

  const branchCodes = [...new Set(groupList.map((g) => g.branchCode))];

  const posBills = await prisma.$queryRawUnsafe<{ branch_code: string; bill_date: string; discount: number }[]>(
    `SELECT b.code as branch_code, pb.bill_date::text as bill_date, pb.discount::float as discount
     FROM public.pos_bills pb
     JOIN public.branches b ON b.id = pb.branch_id
     WHERE b.code = ANY($1::text[]) AND pb.bill_date >= $2::date`,
    branchCodes,
    since.toISOString().slice(0, 10)
  );

  const latestBillByBranch = new Map<string, string>();
  for (const b of posBills) {
    const cur = latestBillByBranch.get(b.branch_code);
    if (!cur || b.bill_date > cur) latestBillByBranch.set(b.branch_code, b.bill_date);
  }

  const now = Date.now();
  const rows: FraudCheckRow[] = groupList.map((g) => {
    const latestSync = latestBillByBranch.get(g.branchCode);
    const syncStaleDays = latestSync ? Math.floor((now - new Date(latestSync).getTime()) / 86400000) : Infinity;
    const hasLiveSync = syncStaleDays <= POS_SYNC_STALE_DAYS;

    const posCount = hasLiveSync
      ? posBills.filter((b) => b.branch_code === g.branchCode && b.bill_date === g.date && b.discount >= g.discountAmount).length
      : null;

    const status: FraudCheckRow["status"] = !hasLiveSync ? "no_data" : posCount! >= g.count ? "match" : "mismatch";

    return {
      branchCode: g.branchCode,
      branchName: g.branchName,
      date: g.date,
      rewardName: g.rewardName,
      discountAmount: g.discountAmount,
      crmConfirmedCount: g.count,
      posMatchingBillCount: posCount,
      status,
    };
  });

  const statusRank = { mismatch: 0, no_data: 1, match: 2 } as const;
  rows.sort((a, b) => statusRank[a.status] - statusRank[b.status] || b.date.localeCompare(a.date));
  return rows;
}

export interface PerTransactionFraudRow {
  redemptionId: string;
  branchName: string;
  date: string;
  customerName: string;
  rewardName: string;
  discountAmount: number;
  posBillNo: string;
  posDiscount: number | null; // null = no bill with this number found at this branch
  staffName: string | null;
  status: "match" | "over" | "under" | "not_found";
}

/**
 * Precise, per-transaction version of the check above — only possible for
 * confirmations where staff typed in the POS bill number (see the confirm
 * route). Looks up that exact bill's real discount and compares it against
 * what the voucher should have given, catching a staff member keying MORE
 * discount into POS than the coupon actually allows (the aggregate check
 * above can't see this: a bigger discount still counts as "≥ the coupon").
 */
export async function getPerTransactionFraudCheck(options?: { days?: number }): Promise<PerTransactionFraudRow[]> {
  const days = options?.days ?? 14;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const redemptions = await prisma.redemption.findMany({
    where: {
      status: "COMPLETED",
      pointsSpent: 0,
      posBillNo: { not: null },
      updatedAt: { gte: since },
      branchId: { not: null },
      reward: { discountAmount: { not: null } },
    },
    include: { branch: true, reward: true, customer: true, fulfilledByStaff: true },
    orderBy: { updatedAt: "desc" },
  });

  const relevant = redemptions.filter((r) => r.branch && r.reward?.discountAmount && r.posBillNo);
  if (relevant.length === 0) return [];

  const branchCodes = [...new Set(relevant.map((r) => r.branch!.code))];

  const posBills = await prisma.$queryRawUnsafe<{ branch_code: string; bill_no: string; discount: number }[]>(
    `SELECT b.code as branch_code, pb.bill_no, pb.discount::float as discount
     FROM public.pos_bills pb
     JOIN public.branches b ON b.id = pb.branch_id
     WHERE b.code = ANY($1::text[])`,
    branchCodes
  );
  const billMap = new Map<string, number>();
  for (const b of posBills) billMap.set(`${b.branch_code}|${b.bill_no}`, Number(b.discount));

  const rows: PerTransactionFraudRow[] = relevant.map((r) => {
    const discountAmount = Number(r.reward!.discountAmount);
    const posDiscount = billMap.get(`${r.branch!.code}|${r.posBillNo}`) ?? null;
    const status: PerTransactionFraudRow["status"] =
      posDiscount === null ? "not_found" : posDiscount > discountAmount ? "over" : posDiscount < discountAmount ? "under" : "match";

    return {
      redemptionId: r.id,
      branchName: r.branch!.name,
      date: r.updatedAt.toISOString().slice(0, 10),
      customerName: customerDisplayName(r.customer),
      rewardName: r.rewardName,
      discountAmount,
      posBillNo: r.posBillNo!,
      posDiscount,
      staffName: r.fulfilledByStaff?.name ?? null,
      status,
    };
  });

  const rank = { over: 0, under: 1, not_found: 2, match: 3 } as const;
  rows.sort((a, b) => rank[a.status] - rank[b.status] || b.date.localeCompare(a.date));
  return rows;
}

export interface BillVerification {
  // false = this branch has no live POS data to check against right now (e.g.
  // Wongnai, or sync gone stale) — the bill number is still recorded for a
  // later manual check, we just can't say anything about it yet.
  hasLiveSync: boolean;
  found: boolean;
  posDiscount: number | null;
}

/**
 * Same lookup as getPerTransactionFraudCheck, but for exactly one bill at
 * confirm time — lets the confirm route tell staff immediately whether the
 * number they just typed matches a real POS bill and the right discount,
 * instead of only surfacing it later on the fraud-check report.
 */
export async function verifyPosBillNo(branchCode: string, billNo: string): Promise<BillVerification> {
  const latest = await prisma.$queryRawUnsafe<{ latest: string | null }[]>(
    `SELECT MAX(pb.bill_date)::text as latest FROM public.pos_bills pb JOIN public.branches b ON b.id = pb.branch_id WHERE b.code = $1`,
    branchCode
  );
  const latestDate = latest[0]?.latest;
  const staleDays = latestDate ? Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000) : Infinity;
  if (staleDays > POS_SYNC_STALE_DAYS) return { hasLiveSync: false, found: false, posDiscount: null };

  const bill = await prisma.$queryRawUnsafe<{ discount: number }[]>(
    `SELECT pb.discount::float as discount FROM public.pos_bills pb JOIN public.branches b ON b.id = pb.branch_id
     WHERE b.code = $1 AND pb.bill_no = $2 LIMIT 1`,
    branchCode,
    billNo
  );
  if (bill.length === 0) return { hasLiveSync: true, found: false, posDiscount: null };
  return { hasLiveSync: true, found: true, posDiscount: Number(bill[0].discount) };
}
