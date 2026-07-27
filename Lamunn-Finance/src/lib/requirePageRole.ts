import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Role = "ADMIN" | "STAFF";

/** Server-component guard: redirects to /login (or /dashboard if wrong role) instead of
 * returning null, since pages need to render something either way. */
export async function requirePageRole(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.staffId) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) redirect("/dashboard");
  return {
    staffId: session.user.staffId!,
    staffName: session.user.name ?? "",
    role: session.user.role as Role,
  };
}
