import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type Role = "SUPER_ADMIN" | "MANAGER" | "STAFF";

/** สิทธิ์ที่แก้ไข/กรอกข้อมูลได้ (STAFF ดูได้อย่างเดียว) — ใช้กับ route ที่เป็นการเขียนข้อมูลทั่วไป */
export const EDITOR_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER"];

/** Server-side guard for API routes: returns staff session info, or null if not logged in
 * (or logged in but missing one of the allowed roles). */
export async function requireStaff(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.staffId) return null;
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) return null;
  return {
    staffId: session.user.staffId,
    staffName: session.user.name ?? "",
    role: session.user.role as Role,
  };
}
