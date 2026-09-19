import { prisma } from "./client";

export type BranchSyncResult = {
  created: string[];
  activated: string[];
  deactivated: string[];
  // Active here but with no row on the POS at all. Used to be auto-deactivated,
  // which knocked out a branch HQ had just created ahead of the POS (Mega Bangna)
  // — now only reported, so a human decides.
  unknownToPos: string[];
  at: string;
};

/**
 * Mirrors branch existence/active-state from the POS's own branches table (public.branches,
 * read-only access) into our Branch table — so a branch opened/closed in the POS is picked
 * up here automatically instead of needing a manual fix every time. Never touches name/code
 * of an existing CRM branch (only isActive), so admin-entered branch naming isn't clobbered;
 * brand-new branches are created with the POS's own name since there's no prior CRM name to
 * preserve. A CRM branch the POS has never heard of is left alone and listed in
 * `unknownToPos`.
 */
export async function syncBranchesFromPos(): Promise<BranchSyncResult> {
  const posBranches = await prisma.$queryRaw<{ code: string; name: string; is_active: boolean }[]>`
    SELECT code, name, is_active FROM public.branches
  `;
  const posByCode = new Map(posBranches.map((b) => [b.code, b]));

  const created: string[] = [];
  const activated: string[] = [];
  const deactivated: string[] = [];
  const unknownToPos: string[] = [];

  for (const pos of posBranches) {
    const existing = await prisma.branch.findUnique({ where: { code: pos.code } });
    if (!existing) {
      if (pos.is_active) {
        await prisma.branch.create({ data: { code: pos.code, name: pos.name, isActive: true } });
        created.push(pos.code);
      }
      continue;
    }
    if (existing.isActive !== pos.is_active) {
      await prisma.branch.update({ where: { id: existing.id }, data: { isActive: pos.is_active } });
      (pos.is_active ? activated : deactivated).push(pos.code);
    }
  }

  const crmBranches = await prisma.branch.findMany();
  for (const b of crmBranches) {
    if (!posByCode.has(b.code) && b.isActive) unknownToPos.push(b.code);
  }

  return { created, activated, deactivated, unknownToPos, at: new Date().toISOString() };
}

// Admin pages call this on load so a new POS branch appears the first time
// anyone opens the admin that day — one run per instance per 10 minutes, and a
// failure never blocks the page (the daily cron is the guaranteed pass).
let lastRun = 0;
let lastResult: BranchSyncResult | null = null;
const THROTTLE_MS = 10 * 60 * 1000;

export async function syncBranchesFromPosThrottled(): Promise<BranchSyncResult | null> {
  if (lastResult && Date.now() - lastRun < THROTTLE_MS) return lastResult;
  lastRun = Date.now();
  try {
    lastResult = await syncBranchesFromPos();
  } catch (e) {
    console.error("[posBranches] sync failed:", e instanceof Error ? e.message : e);
    return lastResult;
  }
  return lastResult;
}
