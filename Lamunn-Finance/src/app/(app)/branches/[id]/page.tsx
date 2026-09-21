import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import BranchEditForm from "@/components/BranchEditForm";
import GpRateHistoryManager from "@/components/GpRateHistoryManager";

export default async function BranchEditPage({ params }: { params: { id: string } }) {
  await requireSectionPage("BRANCHES", "edit");
  // ไม่ขึ้นกับกัน (gpHistory กรองด้วย params.id ตรงๆ ไม่ต้องรอ branch โหลดเสร็จก่อน) ยิงพร้อมกันได้เลย
  const [branch, gpHistory] = await Promise.all([
    prisma.branch.findUnique({
      where: { id: params.id },
      include: { rentConfig: true, creditTermConfig: true },
    }),
    prisma.gpRateHistory.findMany({
      where: { branchId: params.id },
      orderBy: [{ effectiveYear: "desc" }, { effectiveMonth: "desc" }],
    }),
  ]);
  if (!branch) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-bold text-gray-800">
        แก้ไขสาขา — {branch.code} {branch.name}
      </h1>
      <BranchEditForm branch={branch} />
      {branch.rentConfig?.rentType === "GP" && (
        <div className="mt-6">
          <GpRateHistoryManager
            branchId={branch.id}
            history={gpHistory}
            baseGpPercentStorefront={branch.rentConfig.gpPercentStorefront}
            baseGpPercentDelivery={branch.rentConfig.gpPercentDelivery}
          />
        </div>
      )}
    </div>
  );
}
