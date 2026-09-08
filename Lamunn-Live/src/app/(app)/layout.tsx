import { requirePageRole } from "@/lib/requirePageRole";
import { RoleProvider } from "@/lib/RoleContext";
import Nav from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePageRole();

  return (
    <RoleProvider role={staff.role}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Nav role={staff.role} name={staff.staffName} />
        <div className="flex-1 overflow-x-hidden bg-gray-50 p-4 md:p-6">{children}</div>
      </div>
    </RoleProvider>
  );
}
