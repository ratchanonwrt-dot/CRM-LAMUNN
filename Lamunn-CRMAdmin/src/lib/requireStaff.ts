import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type StaffRole = "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF";

/** Server-side guard for API routes: returns the staff session info, or null if the
 * caller isn't logged in as staff / doesn't have one of the allowed roles. */
export async function requireStaff(allowedRoles?: StaffRole[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.userType !== "staff") return null;
  if (allowedRoles && !allowedRoles.includes(session.user.role as StaffRole)) return null;
  return {
    staffId: session.user.staffId!,
    role: session.user.role as StaffRole,
    branchId: session.user.branchId ?? null,
  };
}
