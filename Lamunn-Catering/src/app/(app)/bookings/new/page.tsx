import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import NewBookingForm from "@/components/NewBookingForm";

export default async function NewBookingPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const packages = await prisma.cateringPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จองจัดเลี้ยงใหม่</h1>
      <NewBookingForm packages={packages} />
    </div>
  );
}
