import { notFound } from "next/navigation";
import { prisma } from "@lamunn/db";
import ConfirmRedemptionButton from "@/components/ConfirmRedemptionButton";

const statusLabel: Record<string, string> = {
  PENDING: "รอยืนยัน",
  COMPLETED: "ยืนยันแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
};

export default async function RedemptionConfirmPage({ params }: { params: { id: string } }) {
  const redemption = await prisma.redemption.findUnique({
    where: { id: params.id },
    include: { reward: true, customer: true, branch: true },
  });

  if (!redemption) notFound();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-bold text-gray-800">ยืนยันการแลกรางวัล</h1>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <p className="text-xs text-gray-400">ลูกค้า</p>
          <p className="font-medium text-gray-800">{redemption.customer.name ?? redemption.customer.phone ?? "-"}</p>
          {redemption.customer.phone && <p className="text-sm text-gray-500">{redemption.customer.phone}</p>}
        </div>
        <div>
          <p className="text-xs text-gray-400">รางวัล</p>
          <p className="font-medium text-gray-800">{redemption.reward.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">แต้มที่ใช้</p>
          <p className="font-medium text-gray-800">{redemption.pointsSpent} แต้ม</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">สถานะ</p>
          <p
            className={
              redemption.status === "COMPLETED"
                ? "font-semibold text-brand-700"
                : redemption.status === "CANCELLED"
                  ? "font-semibold text-red-600"
                  : "font-semibold text-gray-600"
            }
          >
            {statusLabel[redemption.status] ?? redemption.status}
            {redemption.branch ? ` · ${redemption.branch.name}` : ""}
          </p>
        </div>

        {redemption.status === "PENDING" && <ConfirmRedemptionButton redemptionId={redemption.id} />}
      </div>
    </div>
  );
}
