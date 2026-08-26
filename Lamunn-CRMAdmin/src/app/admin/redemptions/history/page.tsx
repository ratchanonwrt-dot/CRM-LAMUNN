import Link from "next/link";
import { format } from "date-fns";
import { prisma, customerDisplayName } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import DeleteButton from "@/components/DeleteButton";
import RedemptionHistoryFilter from "@/components/RedemptionHistoryFilter";
import { ArrowLeft } from "lucide-react";
import type { Prisma } from "@prisma/client";

export default async function RedemptionHistoryPage({
  searchParams,
}: {
  searchParams: { rewardName?: string; branchId?: string; from?: string; to?: string };
}) {
  await requirePageRole("redemptions");
  const rewardNameFilter = searchParams.rewardName || undefined;
  const branchIdFilter = searchParams.branchId || undefined;
  const fromFilter = searchParams.from || undefined;
  const toFilter = searchParams.to || undefined;

  const where: Prisma.RedemptionWhereInput = {
    status: "COMPLETED",
    ...(rewardNameFilter ? { rewardName: rewardNameFilter } : {}),
    ...(branchIdFilter ? { branchId: branchIdFilter } : {}),
    ...(fromFilter || toFilter
      ? {
          updatedAt: {
            ...(fromFilter ? { gte: new Date(`${fromFilter}T00:00:00`) } : {}),
            ...(toFilter ? { lte: new Date(`${toFilter}T23:59:59.999`) } : {}),
          },
        }
      : {}),
  };

  // A source-of-truth audit view needs everything matching the filters, not a
  // capped preview — this page is for reconciling counts against register
  // receipts, so a silently-truncated list would defeat the purpose.
  const [history, rewardNames, branches] = await Promise.all([
    prisma.redemption.findMany({
      where,
      include: { reward: true, customer: true, branch: true, fulfilledByStaff: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.redemption.findMany({
      where: { status: "COMPLETED" },
      distinct: ["rewardName"],
      select: { rewardName: true },
      orderBy: { rewardName: "asc" },
    }),
    prisma.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const branchSummary = new Map<string, number>();
  for (const r of history) {
    const label = r.branch?.name ?? "ไม่ระบุสาขา";
    branchSummary.set(label, (branchSummary.get(label) ?? 0) + 1);
  }
  const branchSummaryRows = [...branchSummary.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <Link href="/admin/redemptions" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} />
        กลับไปหน้ารอยืนยัน
      </Link>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-800">ประวัติการแลกรางวัลทั้งหมด</h1>
        <Link
          href="/admin/redemptions/fraud-check"
          className="rounded-full bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          ตรวจสอบคูปองกับ POS →
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        ดูย้อนหลังว่าสาขาไหนแลกไปเท่าไหร่ วันไหนบ้าง โปรหรือคูปองอะไร และพนักงานคนไหนเป็นคนยืนยันให้ลูกค้าคนไหน
      </p>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <RedemptionHistoryFilter
          rewardNames={rewardNames.map((r) => r.rewardName)}
          branches={branches}
          currentReward={rewardNameFilter}
          currentBranchId={branchIdFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">สรุปตามสาขา ({history.length} ครั้งทั้งหมด)</h2>
          {branchSummaryRows.length === 0 ? (
            <p className="text-xs text-gray-400">ไม่มีข้อมูลตามตัวกรองนี้</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {branchSummaryRows.map(([name, count]) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="text-gray-600">{name}</span>
                  <span className="font-medium text-gray-800">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2">วันที่ยืนยัน</th>
                <th className="px-4 py-2">ลูกค้า</th>
                <th className="px-4 py-2">โปร/คูปอง</th>
                <th className="px-4 py-2">แต้ม</th>
                <th className="px-4 py-2">สาขา</th>
                <th className="px-4 py-2">พนักงานที่ยืนยัน</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    ยังไม่มีประวัติตามตัวกรองนี้
                  </td>
                </tr>
              )}
              {history.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{format(r.updatedAt, "d MMM yyyy HH:mm")}</td>
                  <td className="px-4 py-2">{customerDisplayName(r.customer)}</td>
                  <td className="px-4 py-2">{r.reward?.name ?? r.rewardName}</td>
                  <td className="px-4 py-2">{r.pointsSpent}</td>
                  <td className="px-4 py-2 text-gray-500">{r.branch?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-gray-500">{r.fulfilledByStaff?.name ?? "-"}</td>
                  <td className="px-4 py-2">
                    <DeleteButton
                      endpoint={`/api/admin/redemptions/${r.id}`}
                      confirmMessage={
                        r.pointsSpent > 0
                          ? `ลบรายการนี้ใช่ไหม? ระบบจะคืนแต้ม ${r.pointsSpent} แต้มให้ลูกค้า ${r.customer.phone ?? ""}`
                          : `ลบรายการนี้ใช่ไหม?`
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
