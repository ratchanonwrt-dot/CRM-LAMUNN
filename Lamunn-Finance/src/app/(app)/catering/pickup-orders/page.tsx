import Link from "next/link";
import { prisma } from "@lamunn/db-finance";
import { requireSectionPage } from "@/lib/permissions";
import { formatBaht, formatThaiDate, pickupStatusLabel, paymentStatusLabel } from "@/lib/format";
import DeletePickupOrderButton from "@/components/catering/DeletePickupOrderButton";

const STATUS_OPTIONS = ["PENDING", "READY", "COMPLETED", "CANCELLED"] as const;

export default async function PickupOrdersPage({
  searchParams,
}: {
  searchParams: { branchId?: string; status?: string };
}) {
  await requireSectionPage("CATERING");
  const { branchId, status } = searchParams;

  const [orders, branches] = await Promise.all([
    prisma.pickupOrder.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(status ? { status: status as (typeof STATUS_OPTIONS)[number] } : {}),
      },
      include: { branch: true, items: true },
      orderBy: { pickupDate: "asc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">ยอดนัดรับหน้าร้าน ({orders.length})</h1>
        <Link href="/catering/pickup-orders/new" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 hover:bg-brand-700">
          + บันทึกออเดอร์ใหม่
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">สาขา</label>
          <select name="branchId" defaultValue={branchId ?? ""} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-brand-400 focus:bg-white">
            <option value="">ทั้งหมด</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">สถานะ</label>
          <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 outline-none focus:border-brand-400 focus:bg-white">
            <option value="">ทั้งหมด</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{pickupStatusLabel[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-xl border border-gray-200 px-5 py-2.5 text-gray-600 hover:bg-gray-50">
          กรอง
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันนัดรับ</th>
              <th className="px-4 py-2">ลูกค้า</th>
              <th className="px-4 py-2">รายการ</th>
              <th className="px-4 py-2">สาขา</th>
              <th className="px-4 py-2">ยอดเงิน</th>
              <th className="px-4 py-2">การชำระเงิน</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">
                  {formatThaiDate(o.pickupDate)}
                  {o.pickupTime && <span className="text-gray-400"> · {o.pickupTime} น.</span>}
                </td>
                <td className="px-4 py-2">
                  <p className="font-medium text-gray-800">{o.customerName}</p>
                  {o.customerPhone && <p className="text-xs text-gray-400">{o.customerPhone}</p>}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {o.items.length > 0 ? o.items.map((i) => i.description).join(", ") : o.itemsDescription ?? "-"}
                </td>
                <td className="px-4 py-2 text-gray-500">{o.branch?.name ?? "-"}</td>
                <td className="px-4 py-2 text-gray-700">{formatBaht(o.amount)}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      o.paymentStatus === "FULLY_PAID"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : o.paymentStatus === "DEPOSIT_PAID"
                        ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        : "rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                    }
                  >
                    {paymentStatusLabel[o.paymentStatus]}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{pickupStatusLabel[o.status]}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/catering/pickup-orders/${o.id}`} className="text-brand-600 hover:underline">
                      ดู/แก้ไข
                    </Link>
                    <DeletePickupOrderButton id={o.id} />
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  ไม่พบรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
