import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import NewPickupOrderForm from "@/components/NewPickupOrderForm";

export default async function NewPickupOrderPage() {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">บันทึกยอดนัดรับหน้าร้านใหม่</h1>
      <NewPickupOrderForm branches={branches} />
    </div>
  );
}
