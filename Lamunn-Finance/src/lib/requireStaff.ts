import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Role = "ADMIN" | "STAFF";

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
