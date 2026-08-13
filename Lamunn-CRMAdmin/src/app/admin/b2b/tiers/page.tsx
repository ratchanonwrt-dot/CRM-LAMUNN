import { getB2BTiers } from "@lamunn/db";
import AddB2BTierForm from "@/components/AddB2BTierForm";
import B2BTierRow from "@/components/B2BTierRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function B2BTiersPage() {
  await requirePageRole("b2bTiers");
  const tiers = await getB2BTiers();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ระดับ B2B/Catering</h1>

      <AddB2BTierForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รูป</th>
              <th className="px-4 py-2">ชื่อระดับ</th>
              <th className="px-4 py-2">เกณฑ์ยอดซื้อสะสม</th>
              <th className="px-4 py-2">ส่วนลด</th>
              <th className="px-4 py-2">สิทธิประโยชน์อื่นๆ</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีระดับ B2B/Catering
                </td>
              </tr>
            )}
            {tiers.map((tier) => (
              <B2BTierRow key={tier.id} tier={{ ...tier, minSpend: Number(tier.minSpend) }} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
