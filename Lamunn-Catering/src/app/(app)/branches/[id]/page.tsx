import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-catering";
import { requirePageRole } from "@/lib/requirePageRole";
import BranchEditForm from "@/components/BranchEditForm";

export default async function BranchEditPage({ params }: { params: { id: string } }) {
  await requirePageRole(["SUPER_ADMIN", "MANAGER"]);
  const branch = await prisma.branch.findUnique({ where: { id: params.id } });
  if (!branch) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">แก้ไขสาขา — {branch.name}</h1>
      <BranchEditForm branch={branch} />
    </div>
  );
}
