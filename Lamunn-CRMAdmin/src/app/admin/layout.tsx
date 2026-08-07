import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllowedFeatures } from "@lamunn/db";
import type { StaffRole } from "@prisma/client";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // /admin/login itself renders without the shell (session is null there pre-login).
  if (!session?.user || session.user.userType !== "staff") {
    return <>{children}</>;
  }

  const role = session.user.role as StaffRole;
  const allowedFeatures = await getAllowedFeatures(role);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav role={role} name={session.user.name ?? ""} allowedFeatures={allowedFeatures} />
      <div className="flex-1 bg-gray-50 p-4 md:p-6">{children}</div>
    </div>
  );
}
