import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import NewPickupOrderForm from "@/components/catering/NewPickupOrderForm";

export default async function NewPickupOrderPage() {
  await requireSectionPage("CATERING", "edit");
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">บันทึกยอดนัดรับหน้าร้านใหม่</h1>
      <NewPickupOrderForm branches={branches} />
    </div>
  );
}
