import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@lamunn/db-finance";
import type { Role } from "@/lib/requireStaff";

export type PermissionSection =
  | "DASHBOARD"
  | "REPORTS"
  | "MONTHLY"
  | "CREDIT_TERM"
  | "RENT"
  | "CASH_STATUS"
  | "DEPOSITS"
  | "HELD_DEPOSITS"
  | "EVENTS"
  | "BRANCHES"
  | "RECONCILIATION"
  | "SETTINGS"
  | "CATERING"
  | "ACCOUNTING"
  | "INVESTMENT_COST";

export const PERMISSION_SECTIONS: PermissionSection[] = [
  "DASHBOARD",
  "REPORTS",
  "MONTHLY",
  "CREDIT_TERM",
  "RENT",
  "CASH_STATUS",
  "DEPOSITS",
  "HELD_DEPOSITS",
  "EVENTS",
  "BRANCHES",
  "RECONCILIATION",
  "SETTINGS",
  "CATERING",
  "ACCOUNTING",
  "INVESTMENT_COST",
];

export const SECTION_LABELS: Record<PermissionSection, string> = {
  DASHBOARD: "ภาพรวม",
  REPORTS: "รายงาน/วิเคราะห์",
  MONTHLY: "ยอดขายรายวัน (รายเดือน)",
  CREDIT_TERM: "Credit Term / วางบิล",
  RENT: "ค่าเช่า",
  CASH_STATUS: "สถานะเงินสด",
  DEPOSITS: "เงินเข้าบัญชี",
  HELD_DEPOSITS: "เงินมัดจำ",
  EVENTS: "Event ชั่วคราว",
  BRANCHES: "ตั้งค่าสาขา/ค่าเช่า",
  RECONCILIATION: "เช็คยอด POS",
  SETTINGS: "ตั้งค่าระบบ",
  CATERING: "Catering",
  ACCOUNTING: "ระบบบัญชี (งบการเงิน)",
  INVESTMENT_COST: "ค่าใช้จ่ายลงทุน (Investment Cost)",
};

export type PermissionMap = Record<PermissionSection, { canView: boolean; canEdit: boolean }>;

function emptyMap(): PermissionMap {
  return Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s, { canView: false, canEdit: false }])) as PermissionMap;
}

/** SUPER_ADMIN always has full access regardless of the table — a safety net so a
 * misconfigured/missing permission row can never lock every admin out of the system. */
function fullMap(): PermissionMap {
  return Object.fromEntries(PERMISSION_SECTIONS.map((s) => [s, { canView: true, canEdit: true }])) as PermissionMap;
}

export const PERMISSIONS_CACHE_TAG = "role-permissions";

/** อ่านสิทธิ์จากฐานข้อมูล — ห่อด้วย unstable_cache เพราะตารางนี้แทบไม่เคยเปลี่ยน
 * แต่เดิมถูกยิงทุก request ของทุกหน้า (layout เรียกครั้ง หน้าเรียกอีกครั้ง) กลายเป็น
 * ค่าคงที่ที่ต้องวิ่งไป-กลับฐานข้อมูลก่อนหน้าจะเริ่ม render ได้ทุกครั้ง
 * ล้างแคชเมื่อมีการแก้สิทธิ์ที่หน้า "จัดการสิทธิ์ตำแหน่ง" (ดู revalidatePermissions) */
const readPermissionRows = unstable_cache(
  async (role: Role) => prisma.rolePermission.findMany({ where: { role } }),
  ["role-permissions"],
  { tags: [PERMISSIONS_CACHE_TAG] }
);

/** เรียกหลังแก้สิทธิ์ตำแหน่ง เพื่อให้ผู้ใช้เห็นผลทันทีโดยไม่ต้องรอแคชหมดอายุ */
export function revalidatePermissions() {
  revalidateTag(PERMISSIONS_CACHE_TAG);
}

/** Fetches this role's permission map once per request (React `cache()` dedupes repeat calls
 * across the many pages/components that each check permissions during the same render). */
export const getPermissionMap = cache(async (role: Role): Promise<PermissionMap> => {
  if (role === "SUPER_ADMIN") return fullMap();

  const rows = await readPermissionRows(role);
  const map = emptyMap();
  for (const row of rows) {
    map[row.section as PermissionSection] = { canView: row.canView, canEdit: row.canEdit };
  }
  return map;
});

/** The page a role should land on after login / after being denied a page it can't access. */
function fallbackPathFor(role: Role): string {
  return role === "CATERING_STAFF" ? "/catering" : "/dashboard";
}

/** Server-component guard for a specific section: redirects to /login if not authenticated,
 * or to that role's fallback page if it lacks the requested view/edit permission. */
export async function requireSectionPage(section: PermissionSection, mode: "view" | "edit" = "view") {
  const session = await getSession();
  if (!session?.user?.staffId) redirect("/login");
  const role = session.user.role as Role;
  const permissions = await getPermissionMap(role);
  const allowed = mode === "edit" ? permissions[section].canEdit : permissions[section].canView;
  if (!allowed) redirect(fallbackPathFor(role));
  return {
    staffId: session.user.staffId!,
    staffName: session.user.name ?? "",
    role,
    isOwner: session.user.isOwner ?? false,
    permissions,
  };
}

/** Server-side guard for API routes: returns staff session info, or null (caller maps to
 * 401/403) if not logged in or lacking the requested view/edit permission for the section. */
export async function requireSectionApi(section: PermissionSection, mode: "view" | "edit" = "edit") {
  const session = await getSession();
  if (!session?.user?.staffId) return null;
  const role = session.user.role as Role;
  const permissions = await getPermissionMap(role);
  const allowed = mode === "edit" ? permissions[section].canEdit : permissions[section].canView;
  if (!allowed) return null;
  return {
    staffId: session.user.staffId,
    staffName: session.user.name ?? "",
    role,
  };
}
