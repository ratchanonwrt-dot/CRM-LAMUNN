import { prisma } from "@lamunn/db";
import AddTierForm from "@/components/AddTierForm";
import TierRow from "@/components/TierRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function TiersPage() {
  await requirePageRole("tiers");
  const [tiers, vouchers] = await Promise.all([
    prisma.membershipTier.findMany({
      orderBy: { minPoints: "asc" },
      include: { voucherTemplates: { orderBy: { sortOrder: "asc" }, include: { reward: true } } },
    }),
    // Not filtered by isActive: admin should be able to prepare a tier's bundle
    // before switching the voucher on. The cron itself skips inactive vouchers
    // at grant time (see tierLifecycle.ts), so deactivating one pauses it here too.
    prisma.reward.findMany({ where: { kind: "VOUCHER" }, orderBy: { name: "asc" } }),
  ]);

  const availableVouchers = vouchers.map((v) => ({
    id: v.id,
    name: v.name,
    isActive: v.isActive,
    discountPercent: v.discountPercent,
    discountMaxAmount: v.discountMaxAmount === null ? null : Number(v.discountMaxAmount),
    discountAmount: v.discountAmount === null ? null : Number(v.discountAmount),
    minSpendAmount: v.minSpendAmount === null ? null : Number(v.minSpendAmount),
  }));

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
              <th className="px-4 py-2">รักษาระดับทุก 6 เดือน</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีระดับสมาชิก
                </td>
              </tr>
            )}
            {tiers.map((tier) => (
              <TierRow
                key={tier.id}
                tier={{
                  ...tier,
                  maintenanceSpendThreshold: tier.maintenanceSpendThreshold === null ? null : Number(tier.maintenanceSpendThreshold),
                  voucherTemplates: tier.voucherTemplates.map((t) => ({
                    id: t.id,
                    quantity: t.quantity,
                    reward: {
                      id: t.reward.id,
                      name: t.reward.name,
                      isActive: t.reward.isActive,
                      discountPercent: t.reward.discountPercent,
                      discountMaxAmount: t.reward.discountMaxAmount === null ? null : Number(t.reward.discountMaxAmount),
                      discountAmount: t.reward.discountAmount === null ? null : Number(t.reward.discountAmount),
                      minSpendAmount: t.reward.minSpendAmount === null ? null : Number(t.reward.minSpendAmount),
                    },
                  })),
                }}
                availableVouchers={availableVouchers}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
