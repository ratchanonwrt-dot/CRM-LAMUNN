import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import PackageEditForm from "@/components/PackageEditForm";

export default async function PackageEditPage({ params }: { params: { id: string } }) {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const pkg = await prisma.cateringPackage.findUnique({ where: { id: params.id } });
  if (!pkg) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">แก้ไขแพคเกจ — {pkg.name}</h1>
      <PackageEditForm pkg={pkg} />
    </div>
  );
}
