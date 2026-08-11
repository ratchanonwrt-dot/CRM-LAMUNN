import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";

// Redemption.branchId is only set once a staff member confirms it (see confirm
// route), so a PENDING redemption isn't tied to any branch yet — a customer can
// walk into any branch to redeem, so every branch's staff sees the full queue.
export default async function RedemptionsPage() {
  await requirePageRole("redemptions");
  const redemptions = await prisma.redemption.findMany({
    where: { status: "PENDING" },
    include: { reward: true, customer: true },
    orderBy: { createdAt: "asc" },
  });

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
                  <td className="px-4 py-2">{r.customer.name ?? r.customer.phone ?? "-"}</td>
                  <td className="px-4 py-2">{r.reward.name}</td>
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
    </div>
  );
}
