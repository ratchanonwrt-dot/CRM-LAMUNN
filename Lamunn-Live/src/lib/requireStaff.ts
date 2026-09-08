import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type Role = "SUPER_ADMIN" | "MANAGER" | "STAFF";

/** สิทธิ์ที่แก้ไขตั้งค่า (คนไลฟ์/ช่องทาง) และลบรอบไลฟ์ได้ */
export const EDITOR_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER"];
/** สิทธิ์ที่บันทึกยอดไลฟ์ได้ — ทุกคนที่ล็อกอิน (คนหน้างานต้องกรอกตัวเลขได้เอง) */
export const RECORDER_ROLES: Role[] = ["SUPER_ADMIN", "MANAGER", "STAFF"];

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
