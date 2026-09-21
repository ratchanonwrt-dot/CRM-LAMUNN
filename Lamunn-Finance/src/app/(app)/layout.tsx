import { requirePageRole } from "@/lib/requirePageRole";
import { getPermissionMap } from "@/lib/permissions";
import { RoleProvider } from "@/lib/RoleContext";
import Nav from "@/components/Nav";
import NavigationProgress from "@/components/NavigationProgress";
import KeepWarm from "@/components/KeepWarm";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePageRole();
  const permissions = await getPermissionMap(staff.role);

  return (
    <RoleProvider role={staff.role} permissions={permissions}>
      <NavigationProgress />
      <KeepWarm />
      <div className="flex min-h-screen flex-col md:flex-row">
        <Nav role={staff.role} name={staff.staffName} isOwner={staff.isOwner} permissions={permissions} />
        <div className="flex-1 overflow-x-hidden bg-gray-50 p-4 md:p-6">{children}</div>
      </div>
    </RoleProvider>
  );
}
