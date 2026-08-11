import { prisma } from "./client";
import type { StaffRole } from "@prisma/client";

export const ROLES: StaffRole[] = ["SUPER_ADMIN", "SUPERVISOR", "STAFF", "MARKETING"];

export const roleLabel: Record<StaffRole, string> = {
  SUPER_ADMIN: "ผู้จัดการ (Manager)",
  SUPERVISOR: "ผู้ดูแลสาขา (Supervisor)",
  STAFF: "พนักงาน (Staff)",
  MARKETING: "การตลาด (Marketing)",
};

// One entry per nav page. `key` is what page.tsx / AdminNav check against;
// `label` is shown on the /admin/role-permissions matrix.
export const FEATURES = [
  { key: "overview", label: "ภาพรวม" },
  { key: "reports", label: "รายงาน" },
  { key: "enterPoints", label: "กรอกคะแนน" },
  { key: "branches", label: "สาขา" },
  { key: "customerAnalytics", label: "Dashboard ลูกค้า" },
  { key: "tiers", label: "ระดับสมาชิก" },
  { key: "pointRules", label: "กติกาสะสมแต้ม" },
  { key: "rewards", label: "รางวัล" },
  { key: "vouchers", label: "Voucher" },
  { key: "scanRedemption", label: "สแกน QR ยืนยันแลกรางวัล" },
  { key: "redemptions", label: "ยืนยันแลกรางวัล" },
  { key: "settings", label: "ตั้งค่าหน้าตาแอป" },
  { key: "auditLog", label: "ประวัติการแก้ไข" },
  { key: "staff", label: "พนักงาน" },
  { key: "customers", label: "ลูกค้า" },
] as const;

export type FeatureKey = (typeof FEATURES)[number]["key"];

// Behavior before this table existed — kept as the fallback for any role/feature
// combo with no row yet, so nothing changes until SUPER_ADMIN edits it.
const DEFAULT_PERMISSIONS: Record<StaffRole, FeatureKey[]> = {
  SUPER_ADMIN: FEATURES.map((f) => f.key),
  SUPERVISOR: ["overview", "reports", "enterPoints", "customerAnalytics", "pointRules", "scanRedemption", "redemptions", "staff", "customers"],
  // vouchers not included by default for SUPERVISOR/STAFF — SUPER_ADMIN can flip it on via /admin/role-permissions
  STAFF: ["overview", "reports", "enterPoints", "scanRedemption", "redemptions"],
  MARKETING: FEATURES.map((f) => f.key), // full parity with SUPER_ADMIN, per earlier request
};

function defaultAllowed(role: StaffRole, feature: string): boolean {
  return (DEFAULT_PERMISSIONS[role] as string[]).includes(feature);
}

/** Full matrix for the /admin/role-permissions settings page. */
export async function getPermissionMatrix(): Promise<Record<StaffRole, Record<FeatureKey, boolean>>> {
  const rows = await prisma.rolePermission.findMany();
  const overrides = new Map(rows.map((r) => [`${r.role}:${r.feature}`, r.allowed]));

  const matrix = {} as Record<StaffRole, Record<FeatureKey, boolean>>;
  for (const role of ROLES) {
    matrix[role] = {} as Record<FeatureKey, boolean>;
    for (const { key } of FEATURES) {
      matrix[role][key] = role === "SUPER_ADMIN" ? true : overrides.get(`${role}:${key}`) ?? defaultAllowed(role, key);
    }
  }
  return matrix;
}

/** Server-side check used by requirePageRole / AdminNav. SUPER_ADMIN always passes. */
export async function hasPermission(role: StaffRole, feature: FeatureKey): Promise<boolean> {
  if (role === "SUPER_ADMIN") return true;
  const row = await prisma.rolePermission.findUnique({ where: { role_feature: { role, feature } } });
  return row?.allowed ?? defaultAllowed(role, feature);
}

/** Feature keys a role currently has access to — used by AdminNav to filter links. */
export async function getAllowedFeatures(role: StaffRole): Promise<FeatureKey[]> {
  if (role === "SUPER_ADMIN") return FEATURES.map((f) => f.key);
  const matrix = await getPermissionMatrix();
  return FEATURES.filter((f) => matrix[role][f.key]).map((f) => f.key);
}

export async function setRolePermission(role: StaffRole, feature: FeatureKey, allowed: boolean) {
  if (role === "SUPER_ADMIN") return; // never gate the super admin role itself
  await prisma.rolePermission.upsert({
    where: { role_feature: { role, feature } },
    update: { allowed },
    create: { role, feature, allowed },
  });
}
