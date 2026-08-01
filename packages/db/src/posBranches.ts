import { prisma } from "./client";

export type BranchSyncResult = { created: string[]; activated: string[]; deactivated: string[] };

/**
 * Mirrors branch existence/active-state from the POS's own branches table (public.branches,
 * read-only access) into our Branch table — so a branch opened/closed in the POS is picked
 * up here automatically instead of needing a manual fix every time. Never touches name/code
 * of an existing CRM branch (only isActive), so admin-entered branch naming isn't clobbered;
 * brand-new branches are created with the POS's own name since there's no prior CRM name to
 * preserve.
 */
export async function syncBranchesFromPos(): Promise<BranchSyncResult> {
  const posBranches = await prisma.$queryRaw<{ code: string; name: string; is_active: boolean }[]>`
    SELECT code, name, is_active FROM public.branches
  `;
  const posByCode = new Map(posBranches.map((b) => [b.code, b]));

  const created: string[] = [];
  const activated: string[] = [];
  const deactivated: string[] = [];

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

  // CRM branches with no POS row at all (renamed/removed on the POS side) get deactivated too.
  const crmBranches = await prisma.branch.findMany();
  for (const b of crmBranches) {
    if (!posByCode.has(b.code) && b.isActive) {
      await prisma.branch.update({ where: { id: b.id }, data: { isActive: false } });
      deactivated.push(b.code);
    }
  }

  return { created, activated, deactivated };
}
