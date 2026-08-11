import { prisma } from "@lamunn/db";
import AddRewardForm from "@/components/AddRewardForm";
import RewardRow from "@/components/RewardRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function AdminRewardsPage() {
  await requirePageRole("rewards");
  const rewards = await prisma.reward.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จัดการรางวัล</h1>

      <AddRewardForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รูป</th>
              <th className="px-4 py-2">ชื่อรางวัล</th>
              <th className="px-4 py-2">แต้มที่ใช้แลก</th>
              <th className="px-4 py-2">คงเหลือ</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => (
              <RewardRow key={r.id} reward={{ ...r, discountMaxAmount: r.discountMaxAmount === null ? null : Number(r.discountMaxAmount) }} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
