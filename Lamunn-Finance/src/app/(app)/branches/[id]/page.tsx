import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-finance";
import { requirePageRole } from "@/lib/requirePageRole";
import BranchEditForm from "@/components/BranchEditForm";

export default async function BranchEditPage({ params }: { params: { id: string } }) {
  await requirePageRole(["ADMIN"]);
  const branch = await prisma.branch.findUnique({
    where: { id: params.id },
    include: { rentConfig: true, creditTermConfig: true },
  });
  if (!branch) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-bold text-gray-800">
        แก้ไขสาขา — {branch.code} {branch.name}
      </h1>
      <BranchEditForm branch={branch} />
    </div>
  );
}
