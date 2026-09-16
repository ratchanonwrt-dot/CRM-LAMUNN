import { requirePageRole } from "@/lib/requirePageRole";
import { RoleProvider } from "@/lib/RoleContext";
import Nav from "@/components/Nav";
import { prisma } from "@lamunn/db-live";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const staff = await requirePageRole();
  const pendingRequests = await prisma.slotRequest.count({ where: { status: "PENDING" } });

  return (
    <RoleProvider role={staff.role}>
      <div className="flex min-h-screen flex-col bg-paper md:flex-row">
        <Nav role={staff.role} name={staff.staffName} pendingRequests={pendingRequests} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-5 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </RoleProvider>
  );
}
