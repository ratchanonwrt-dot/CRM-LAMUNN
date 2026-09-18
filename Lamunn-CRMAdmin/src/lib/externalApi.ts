import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, customerDisplayName } from "@lamunn/db";

// Read-only API for outside tools (ChatGPT Actions / automations). Auth is one
// shared secret (AI_API_KEY) sent as `Authorization: Bearer …` — the caller is a
// program, not a staff login, so it deliberately bypasses NextAuth.

const NO_STORE = { "Cache-Control": "no-store" };

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

function keyMatches(presented: string): boolean {
  const key = process.env.AI_API_KEY ?? "";
  if (!key || !presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

export function withApiKey<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    const auth = req.headers.get("authorization") ?? "";
    const presented = auth.startsWith("Bearer ") ? auth.slice(7).trim() : (req.headers.get("x-api-key") ?? "").trim();
    if (!keyMatches(presented)) return fail("unauthorized — send Authorization: Bearer <AI_API_KEY>", 401);
    try {
      return await handler(req, ctx);
    } catch (e) {
      console.error("[external api]", e);
      return fail("internal error", 500);
    }
  };
}

export function pagination(sp: URLSearchParams): { page: number; pageSize: number; skip: number; take: number } {
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** `from`/`to` as YYYY-MM-DD (Bangkok calendar days) or a full ISO timestamp. */
export function dateRange(sp: URLSearchParams): { gte?: Date; lte?: Date } | undefined {
  const parse = (v: string | null, endOfDay: boolean): Date | undefined => {
    if (!v) return undefined;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`) : new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };
  const gte = parse(sp.get("from"), false);
  const lte = parse(sp.get("to"), true);
  if (!gte && !lte) return undefined;
  return { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
}

export const num = (d: Prisma.Decimal | number | null | undefined): number | null => (d === null || d === undefined ? null : Number(d));

export function digitsOnly(v: string): string {
  return v.replace(/\D/g, "");
}

// ---------- serializers ----------

const customerBase = Prisma.validator<Prisma.CustomerDefaultArgs>()({ include: { currentTier: { select: { id: true, name: true, minPoints: true } } } });
export type CustomerWithTier = Prisma.CustomerGetPayload<typeof customerBase>;
export const customerInclude = customerBase.include;

export function serializeCustomer(c: CustomerWithTier) {
  return {
    id: c.id,
    name: customerDisplayName(c),
    firstName: c.firstName,
    lastName: c.lastName,
    phone: c.phone,
    email: c.email,
    gender: c.gender,
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString().slice(0, 10) : null,
    pointsBalance: c.pointsBalance,
    lifetimePoints: c.lifetimePoints,
    tier: c.currentTier ? { id: c.currentTier.id, name: c.currentTier.name, minPoints: c.currentTier.minPoints } : null,
    tierAnniversaryAt: c.tierAnniversaryAt,
    isActive: c.isActive,
    registeredAt: c.createdAt,
  };
}

const txBase = Prisma.validator<Prisma.PointTransactionDefaultArgs>()({
  include: { branch: { select: { code: true, name: true } }, customer: { select: { id: true, firstName: true, lastName: true, phone: true } } },
});
export type TransactionRow = Prisma.PointTransactionGetPayload<typeof txBase>;
export const transactionInclude = txBase.include;

export function serializeTransaction(t: TransactionRow) {
  return {
    id: t.id,
    type: t.type,
    points: t.points,
    amount: num(t.amount),
    receiptNo: t.receiptNo,
    note: t.note,
    branch: t.branch ? { code: t.branch.code, name: t.branch.name } : null,
    customer: { id: t.customer.id, name: customerDisplayName(t.customer), phone: t.customer.phone },
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
    expired: t.expired,
    voidedInPos: t.voidedInPos,
  };
}

const redemptionBase = Prisma.validator<Prisma.RedemptionDefaultArgs>()({
  include: {
    branch: { select: { code: true, name: true } },
    customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
    reward: { select: { kind: true, discountAmount: true, discountPercent: true, discountMaxAmount: true, minSpendAmount: true } },
    fulfilledByStaff: { select: { name: true } },
  },
});
export type RedemptionRow = Prisma.RedemptionGetPayload<typeof redemptionBase>;
export const redemptionInclude = redemptionBase.include;

export function serializeRedemption(r: RedemptionRow) {
  return {
    id: r.id,
    rewardName: r.rewardName,
    rewardKind: r.reward?.kind ?? null,
    discount: r.reward
      ? { amount: num(r.reward.discountAmount), percent: r.reward.discountPercent, maxAmount: num(r.reward.discountMaxAmount), minSpend: num(r.reward.minSpendAmount) }
      : null,
    pointsSpent: r.pointsSpent,
    status: r.status,
    branch: r.branch ? { code: r.branch.code, name: r.branch.name } : null,
    customer: { id: r.customer.id, name: customerDisplayName(r.customer), phone: r.customer.phone },
    confirmedByStaff: r.fulfilledByStaff?.name ?? null,
    posBillNo: r.posBillNo,
    requestedAt: r.createdAt,
    updatedAt: r.updatedAt,
    expiresAt: r.expiresAt,
  };
}
