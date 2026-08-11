import { prisma, getB2BTiers, resolveB2BTier } from "@lamunn/db";
import AddB2BCustomerForm from "@/components/AddB2BCustomerForm";
import B2BCustomerRow from "@/components/B2BCustomerRow";
import { requirePageRole } from "@/lib/requirePageRole";

export default async function B2BCustomersPage() {
  await requirePageRole("b2bCustomers");
  const [customers, tiers] = await Promise.all([
    prisma.b2BCustomer.findMany({ orderBy: { createdAt: "desc" } }),
    getB2BTiers(),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">ลูกค้า B2B/Catering</h1>
      <p className="mb-6 text-sm text-gray-500">ลูกค้ากลุ่ม B2B/Catering ทั้งหมด {customers.length} ราย — แยกจากระบบสมาชิกลูกค้าหน้าร้าน</p>

      <AddB2BCustomerForm />

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">ชื่อบริษัท/ร้าน</th>
              <th className="px-4 py-2">ผู้ติดต่อ</th>
              <th className="px-4 py-2">เบอร์โทร</th>
              <th className="px-4 py-2">ยอดซื้อสะสม</th>
              <th className="px-4 py-2">ระดับ</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีลูกค้า B2B/Catering
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <B2BCustomerRow
                key={c.id}
                customer={{ ...c, totalSpend: Number(c.totalSpend) }}
                tierName={resolveB2BTier(Number(c.totalSpend), tiers)?.name ?? null}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
