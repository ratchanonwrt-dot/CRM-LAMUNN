import { prisma } from "@lamunn/db";
import AddRewardForm from "@/components/AddRewardForm";
import ToggleActiveButton from "@/components/ToggleActiveButton";
import DeleteButton from "@/components/DeleteButton";

export default async function AdminRewardsPage() {
  const rewards = await prisma.reward.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">จัดการรางวัล</h1>

      <AddRewardForm />

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รูป</th>
              <th className="px-4 py-2">ชื่อรางวัล</th>
              <th className="px-4 py-2">แต้มที่ใช้แลก</th>
              <th className="px-4 py-2">คงเหลือ</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rewards.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {r.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt={r.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.pointsCost}</td>
                <td className="px-4 py-2 text-gray-500">{r.stock === null ? "ไม่จำกัด" : r.stock}</td>
                <td className="px-4 py-2">
                  <ToggleActiveButton endpoint={`/api/admin/rewards/${r.id}`} isActive={r.isActive} />
                </td>
                <td className="px-4 py-2">
                  <DeleteButton endpoint={`/api/admin/rewards/${r.id}`} confirmMessage={`ลบรางวัล "${r.name}" ใช่ไหม?`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
