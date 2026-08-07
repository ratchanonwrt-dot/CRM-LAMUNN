import { prisma } from "@lamunn/db";
import { requirePageRole } from "@/lib/requirePageRole";
import CustomerAnalyticsDashboard from "@/components/CustomerAnalyticsDashboard";

const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "<20", min: 0, max: 19 },
  { label: "20-24", min: 20, max: 24 },
  { label: "25-29", min: 25, max: 29 },
  { label: "30-34", min: 30, max: 34 },
  { label: "35-39", min: 35, max: 39 },
  { label: "40-44", min: 40, max: 44 },
  { label: "45+", min: 45, max: 999 },
];

const MONTH_LABELS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

const GENDER_LABELS: Record<string, string> = {
  FEMALE: "หญิง",
  MALE: "ชาย",
  LGBTQ: "LGBTQ+",
  UNSPECIFIED: "ไม่ระบุ",
};

function ageFromDob(dob: Date, now: Date): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export default async function CustomerAnalyticsPage() {
  await requirePageRole("customerAnalytics");

  const [customers, lastEarnByCustomer, redemptionStats] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, name: true, phone: true, gender: true, dateOfBirth: true, createdAt: true, pointsBalance: true, lifetimePoints: true },
    }),
    prisma.pointTransaction.groupBy({ by: ["customerId"], where: { type: "EARN" }, _max: { createdAt: true } }),
    prisma.redemption.groupBy({ by: ["rewardId"], _count: true }),
  ]);

  const now = new Date();
  const lastActivityByCustomer = new Map(lastEarnByCustomer.map((r) => [r.customerId, r._max.createdAt]));

  // ---- Signup trend: count per month for the last 12 months ----
  const monthBuckets: { key: string; label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, count: 0 });
  }
  const monthIndex = new Map(monthBuckets.map((b, i) => [b.key, i]));
  for (const c of customers) {
    const key = `${c.createdAt.getFullYear()}-${c.createdAt.getMonth()}`;
    const idx = monthIndex.get(key);
    if (idx !== undefined) monthBuckets[idx].count += 1;
  }

  // ---- Activity recency (last EARN date) ----
  let active1m = 0;
  let active3m = 0;
  let inactive3m = 0;
  let never = 0;
  for (const c of customers) {
    const last = lastActivityByCustomer.get(c.id);
    if (!last) {
      never += 1;
      continue;
    }
    const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) active1m += 1;
    else if (days <= 90) active3m += 1;
    else inactive3m += 1;
  }

  // ---- Gender ----
  const genderCounts: Record<string, number> = { FEMALE: 0, MALE: 0, LGBTQ: 0, UNSPECIFIED: 0 };
  for (const c of customers) {
    const g = c.gender ?? "UNSPECIFIED";
    genderCounts[g] = (genderCounts[g] ?? 0) + 1;
  }

  // ---- Age buckets ----
  const ageCounts = AGE_BUCKETS.map((b) => ({ label: b.label, count: 0 }));
  for (const c of customers) {
    if (!c.dateOfBirth) continue;
    const age = ageFromDob(c.dateOfBirth, now);
    const idx = AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
    if (idx >= 0) ageCounts[idx].count += 1;
  }

  // ---- Birth month ----
  const birthMonthCounts = MONTH_LABELS.map((label) => ({ label, count: 0 }));
  for (const c of customers) {
    if (!c.dateOfBirth) continue;
    birthMonthCounts[c.dateOfBirth.getMonth()].count += 1;
  }

  // ---- Top spenders (by lifetime points) ----
  const topCustomers = [...customers]
    .sort((a, b) => b.lifetimePoints - a.lifetimePoints)
    .slice(0, 10)
    .map((c) => ({ label: c.name || c.phone || "-", value: c.lifetimePoints }));

  // ---- Top rewards ----
  const rewardIds = redemptionStats.map((r) => r.rewardId);
  const rewards = rewardIds.length > 0 ? await prisma.reward.findMany({ where: { id: { in: rewardIds } } }) : [];
  const rewardNameById = new Map(rewards.map((r) => [r.id, r.name]));
  const topRewards = [...redemptionStats]
    .sort((a, b) => b._count - a._count)
    .slice(0, 10)
    .map((r) => ({ label: rewardNameById.get(r.rewardId) ?? "-", value: r._count }));

  return (
    <CustomerAnalyticsDashboard
      totalCustomers={customers.length}
      signupTrend={monthBuckets.map((b) => ({ label: b.label, value: b.count }))}
      activityRecency={[
        { label: "ใช้งานล่าสุด <1 เดือน", value: active1m },
        { label: "1-3 เดือน", value: active3m },
        { label: "มากกว่า 3 เดือน", value: inactive3m },
        { label: "ไม่เคยซื้อ", value: never },
      ]}
      genderStats={Object.entries(genderCounts).map(([k, v]) => ({ label: GENDER_LABELS[k], value: v }))}
      ageStats={ageCounts.map((a) => ({ label: a.label, value: a.count }))}
      birthMonthStats={birthMonthCounts.map((m) => ({ label: m.label, value: m.count }))}
      topCustomers={topCustomers}
      topRewards={topRewards}
    />
  );
}
