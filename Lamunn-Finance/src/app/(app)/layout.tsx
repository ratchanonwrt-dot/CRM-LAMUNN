import { requirePageRole } from "@/lib/requirePageRole";
import Nav from "@/components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePageRole();

  return (
    <div className="flex min-h-screen">
      <Nav role={staff.role} name={staff.staffName} />
      <div className="flex-1 bg-gray-50 p-6">{children}</div>
    </div>
  );
}
