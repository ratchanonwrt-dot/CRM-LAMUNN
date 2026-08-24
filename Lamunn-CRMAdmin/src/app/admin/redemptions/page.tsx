import Link from "next/link";
import { format } from "date-fns";
import { prisma, customerDisplayName } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import DeleteButton from "@/components/DeleteButton";
import RedemptionHistoryFilter from "@/components/RedemptionHistoryFilter";

// Redemption.branchId is only set once a staff member confirms it (see confirm
// route), so a PENDING redemption isn't tied to any branch yet — a customer can
// walk into any branch to redeem, so every branch's staff sees the full queue.
export default async function RedemptionsPage({ searchParams }: { searchParams: { rewardName?: string } }) {
  await requirePageRole("redemptions");
  const rewardNameFilter = searchParams.rewardName || undefined;

  const [redemptions, history, rewardNames] = await Promise.all([
    prisma.redemption.findMany({
      where: { status: "PENDING" },
      include: { reward: true, customer: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.redemption.findMany({
      where: { status: "COMPLETED", ...(rewardNameFilter ? { rewardName: rewardNameFilter } : {}) },
      include: { reward: true, customer: true, branch: true, fulfilledByStaff: true },
      orderBy: { updatedAt: "desc" },
      // A filtered audit view needs the FULL matching history to cross-check a
      // count against — only the unfiltered "everything" view caps at 100.
      ...(rewardNameFilter ? {} : { take: 100 }),
    }),
    prisma.redemption.findMany({
      where: { status: "COMPLETED" },
      distinct: ["rewardName"],
      select: { rewardName: true },
      orderBy: { rewardName: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">รอยืนยันแลกรางวัล</h1>
      <p className="mb-6 text-sm text-gray-500">
        ปกติลูกค้าจะโชว์ QR ให้สแกนโดยตรง (เปิดหน้ายืนยันทันที) — หน้านี้ไว้ใช้กรณีสแกนไม่ได้ ให้กดยืนยันมือแทน
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่แลก</th>
              <th className="px-4 py-2">ลูกค้า</th>
              <th className="px-4 py-2">รางวัล</th>
              <th className="px-4 py-2">แต้ม</th>
              <th className="px-4 py-2">วันหมดอายุ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {redemptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  ไม่มีรายการรอยืนยัน
                </td>
              </tr>
            )}
            {redemptions.map((r) => {
              const isExpired = r.expiresAt !== null && r.expiresAt < new Date();
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-500">{format(r.createdAt, "d MMM yyyy HH:mm")}</td>
                  <td className="px-4 py-2">{customerDisplayName(r.customer)}</td>
                  <td className="px-4 py-2">{r.reward?.name ?? r.rewardName}</td>
                  <td className="px-4 py-2">{r.pointsSpent}</td>
                  <td className="px-4 py-2">
                    {r.expiresAt ? (
                      <span className={isExpired ? "font-medium text-red-600" : "text-gray-500"}>
                        {format(r.expiresAt, "d MMM yyyy")}
                        {isExpired ? " (หมดอายุ)" : ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/redemptions/${r.id}`} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                      ดู/ยืนยัน
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-2 mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">
          ประวัติรางวัลที่ยืนยันแล้ว {rewardNameFilter ? `— ${rewardNameFilter} (${history.length} ครั้ง)` : "(ล่าสุด 100 รายการ)"}
        </h2>
        <RedemptionHistoryFilter rewardNames={rewardNames.map((r) => r.rewardName)} current={rewardNameFilter} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2">วันที่ยืนยัน</th>
              <th className="px-4 py-2">ลูกค้า</th>
              <th className="px-4 py-2">รางวัล</th>
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
                  ยังไม่มีประวัติ
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
  );
}
