import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Server-side guard for page components: redirects to /admin if the logged-in
 * staff's role isn't in the allowed list. Use the same roles array AdminNav.tsx
 * uses for that page's link, so behavior for existing roles never changes. */
export async function requirePageRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!role || !allowedRoles.includes(role)) redirect("/admin");
  return session!.user;
}
