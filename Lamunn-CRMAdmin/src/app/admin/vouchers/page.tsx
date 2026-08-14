import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import AddVoucherForm from "@/components/AddVoucherForm";
import VoucherCatalogRow from "@/components/VoucherCatalogRow";
import VoucherForm from "@/components/VoucherForm";

export default async function VouchersPage() {
  await requirePageRole("vouchers");
  const vouchers = await prisma.reward.findMany({
    where: { kind: "VOUCHER" },
    orderBy: { createdAt: "desc" },
    include: { tierVoucherTemplates: { include: { tier: true } } },
  });
  const activeVouchers = vouchers.filter((v) => v.isActive);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-gray-800">จัดการวอเชอร์</h1>
      <p className="mb-6 text-sm text-gray-500">
        วอเชอร์แยกจากรางวัลที่ลูกค้าใช้แต้มแลกเอง — ที่นี่ไว้สร้างวอเชอร์และแจกให้ลูกค้าทีละคนตามเบอร์โทร (ไม่หักแต้ม ไม่โชว์ในหน้าแลกรางวัลของลูกค้า)
      </p>

      <AddVoucherForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">รูป</th>
              <th className="px-4 py-2">ชื่อวอเชอร์</th>
              <th className="px-4 py-2">ส่วนลด</th>
              <th className="px-4 py-2">คงเหลือ</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีวอเชอร์
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <VoucherCatalogRow
                  key={v.id}
                  voucher={{
                    ...v,
                    discountMaxAmount: v.discountMaxAmount === null ? null : Number(v.discountMaxAmount),
                    discountAmount: v.discountAmount === null ? null : Number(v.discountAmount),
                    minSpendAmount: v.minSpendAmount === null ? null : Number(v.minSpendAmount),
                  }}
                  autoTierNames={v.tierVoucherTemplates.map((t) => t.tier.name)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-1 mt-10 text-lg font-semibold text-gray-800">แจกวอเชอร์ให้ลูกค้า</h2>
      <p className="mb-4 text-sm text-gray-500">กรอกเบอร์โทรลูกค้าและเลือกวอเชอร์จากรายการด้านบน ระบบจะออกให้ทันที</p>
      <VoucherForm
        hasInactiveVouchers={vouchers.length > 0 && activeVouchers.length === 0}
        rewards={activeVouchers.map((r) => ({
          id: r.id,
          name: r.name,
          stock: r.stock,
          discountPercent: r.discountPercent,
          discountMaxAmount: r.discountMaxAmount === null ? null : Number(r.discountMaxAmount),
          discountAmount: r.discountAmount === null ? null : Number(r.discountAmount),
          minSpendAmount: r.minSpendAmount === null ? null : Number(r.minSpendAmount),
        }))}
      />
    </div>
  );
}
