import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission, type FeatureKey } from "@lamunn/db";
import type { StaffRole } from "@prisma/client";

/** Server-side guard for page components: redirects to /admin if the logged-in
 * staff's role doesn't have this feature enabled in /admin/role-permissions
 * (SUPER_ADMIN always passes). */
export async function requirePageRole(feature: FeatureKey) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as StaffRole | undefined;
  if (!role || !(await hasPermission(role, feature))) redirect("/admin");
  return session!.user;
}
