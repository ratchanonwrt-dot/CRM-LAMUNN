import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, syncBranchesFromPosThrottled } from "@lamunn/db";
import { Users, Building2, Coins, Trophy, Store } from "lucide-react";

const GREETING_HOUR_MAP: [number, string][] = [
  [5, "สวัสดีตอนเช้า"],
  [11, "สวัสดีตอนสาย"],
  [13, "สวัสดีตอนเที่ยง"],
  [17, "สวัสดีตอนบ่าย"],
  [24, "สวัสดีตอนเย็น"],
];
function greetingForNow(): string {
  const hour = new Date().getHours();
  return GREETING_HOUR_MAP.find(([until]) => hour < until)?.[1] ?? GREETING_HOUR_MAP[0][1];
}

export default async function AdminDashboardPage() {
  // First page everyone lands on — cheapest place to pick up a shop the POS
  // added since yesterday (throttled, never blocks the page).
  await syncBranchesFromPosThrottled();
  const session = await getServerSession(authOptions);
  const role = session!.user.role!;
  const branchId = session!.user.branchId;
  const name = session!.user.name ?? "";

  const isHqRole = role === "SUPER_ADMIN" || role === "MARKETING" || role === "SUPERVISOR";
  const branchFilter = isHqRole ? {} : { branchId: branchId ?? undefined };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalCustomers, totalBranches, pointsToday, pointsAllTime, byBranch] = await Promise.all([
    prisma.customer.count(),
    prisma.branch.count({ where: { isActive: true } }),
    prisma.pointTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN", createdAt: { gte: startOfToday }, ...branchFilter },
    }),
    prisma.pointTransaction.aggregate({
      _sum: { points: true },
      where: { type: "EARN", ...branchFilter },
    }),
    prisma.branch.findMany({
      where: isHqRole ? { isActive: true } : { id: branchId ?? undefined },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { code: "asc" },
    }),
  ]);

  const stats = [
    { label: "ลูกค้าทั้งหมด", value: totalCustomers, icon: Users, tint: "bg-pink-50 text-pink-500" },
    { label: "สาขาที่เปิดใช้งาน", value: totalBranches, icon: Building2, tint: "bg-violet-50 text-violet-500" },
    { label: "แต้มที่แจกวันนี้", value: pointsToday._sum.points ?? 0, icon: Coins, tint: "bg-amber-50 text-amber-500" },
    { label: "แต้มที่แจกทั้งหมด", value: pointsAllTime._sum.points ?? 0, icon: Trophy, tint: "bg-brand-50 text-brand-600" },
  ];

  const maxTransactions = Math.max(1, ...byBranch.map((b) => b._count.transactions));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-600">{greetingForNow()}{name ? `, ${name}` : ""}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">ภาพรวมระบบ</h1>
        <p className="mt-1 text-sm text-gray-500">สรุปภาพรวมลูกค้าและแต้มสะสมทั้งระบบ ณ ตอนนี้</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-200"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.tint}`}>
                <Icon size={19} strokeWidth={2.2} />
              </span>
              <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-gray-900">{s.value.toLocaleString()}</p>
              <p className="mt-0.5 text-sm text-gray-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm shadow-gray-100">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
            <Store size={16} strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">รายการตามสาขา</h2>
            <p className="text-xs text-gray-400">จำนวนธุรกรรมสะสมแต้มของแต่ละสาขา</p>
          </div>
        </div>
        {byBranch.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">ยังไม่มีข้อมูลสาขา</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {byBranch.map((b) => {
              const barWidth = Math.max(4, Math.round((b._count.transactions / maxTransactions) * 100));
              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50/70">
                  <div className="w-24 shrink-0 font-mono text-xs text-gray-400">{b.code}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{b.name}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-brand-400" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                  <div className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-800">
                    {b._count.transactions.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
