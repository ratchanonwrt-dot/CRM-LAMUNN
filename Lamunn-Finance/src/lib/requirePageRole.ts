import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/requireStaff";

/** Server-component guard: redirects to /login (or /dashboard if wrong role) instead of
 * returning null, since pages need to render something either way. */
export async function requirePageRole(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session?.user?.staffId) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) redirect("/dashboard");
  return {
    staffId: session.user.staffId!,
    staffName: session.user.name ?? "",
    role: session.user.role as Role,
    isOwner: session.user.isOwner ?? false,
  };
}

/** Server-component guard for the one page only the designated "owner" account may view. */
export async function requirePageOwner() {
  const session = await getSession();
  if (!session?.user?.staffId) redirect("/login");
  if (!session.user.isOwner) redirect("/dashboard");
  return {
    staffId: session.user.staffId!,
    staffName: session.user.name ?? "",
  };
}
