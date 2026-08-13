import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma, getB2BTiers, resolveB2BTier, nextB2BTier } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import B2BPurchaseForm from "@/components/B2BPurchaseForm";

export default async function B2BCustomerDetailPage({ params }: { params: { id: string } }) {
  await requirePageRole("b2bCustomers");

  const [customer, tiers, purchases] = await Promise.all([
    prisma.b2BCustomer.findUnique({ where: { id: params.id } }),
    getB2BTiers(),
    prisma.b2BPurchase.findMany({
      where: { b2bCustomerId: params.id },
      orderBy: { createdAt: "desc" },
      include: { processedByStaff: { select: { name: true } } },
    }),
  ]);

  if (!customer) notFound();

  const totalSpend = Number(customer.totalSpend);
  const currentTier = resolveB2BTier(totalSpend, tiers);
  const upcomingTier = nextB2BTier(totalSpend, tiers);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-gray-800">{customer.companyName}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {customer.contactName ?? "-"} · {customer.phone ?? "-"} · {customer.email ?? "-"}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ยอดซื้อสะสม</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{totalSpend.toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ระดับปัจจุบัน</p>
          <p className="mt-1 text-lg font-bold text-brand-700">{currentTier ? `${currentTier.name} (ลด ${currentTier.discountPercent}%)` : "ยังไม่ถึงระดับ"}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">ระดับถัดไป</p>
          <p className="mt-1 text-lg font-bold text-gray-800">
            {upcomingTier ? `อีก ${(Number(upcomingTier.minSpend) - totalSpend).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท ถึง ${upcomingTier.name}` : "-"}
          </p>
        </div>
      </div>

      {currentTier?.benefit && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">สิทธิประโยชน์อื่นๆ ของระดับ {currentTier.name}</p>
          <p className="mt-1 text-sm text-gray-700">{currentTier.benefit}</p>
        </div>
      )}

      <B2BPurchaseForm customerId={customer.id} />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">ยอดซื้อ</th>
              <th className="px-4 py-2">หมายเหตุ</th>
              <th className="px-4 py-2">บันทึกโดย</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีประวัติการซื้อ
                </td>
              </tr>
            )}
            {purchases.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-500">{format(p.createdAt, "d MMM yyyy HH:mm")}</td>
                <td className="px-4 py-2 font-medium text-gray-800">{Number(p.amount).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท</td>
                <td className="px-4 py-2 text-gray-500">{p.note ?? "-"}</td>
                <td className="px-4 py-2 text-gray-500">{p.processedByStaff?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
