import { getMembershipTiers } from "@lamunn/db";
import AddTierForm from "@/components/AddTierForm";
import TierRow from "@/components/TierRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function TiersPage() {
  await requirePageRole("tiers");
  const tiers = await getMembershipTiers();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ระดับสมาชิก</h1>

      <AddTierForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รูป</th>
              <th className="px-4 py-2">ชื่อระดับ</th>
              <th className="px-4 py-2">เกณฑ์แต้ม</th>
              <th className="px-4 py-2">สิทธิประโยชน์</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีระดับสมาชิก
                </td>
              </tr>
            )}
            {tiers.map((tier) => (
              <TierRow key={tier.id} tier={tier} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
