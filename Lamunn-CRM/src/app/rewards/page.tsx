import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints, getExpirySummary } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import GreetingPointsCard from "@/components/GreetingPointsCard";
import BottomNav from "@/components/BottomNav";
import RewardCard from "@/components/RewardCard";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function RewardsPage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const customerCheck = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customerCheck?.name || !customerCheck.dateOfBirth) redirect("/onboarding?callbackUrl=/rewards");

  await expireOldPoints(customerId);

  const [rewards, customer, expirySummary] = await Promise.all([
    prisma.reward.findMany({ where: { isActive: true }, orderBy: { pointsCost: "asc" } }),
    prisma.customer.findUnique({ where: { id: customerId } }),
    getExpirySummary(customerId),
  ]);

  return (
    <>
      <HeroBanner />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <GreetingPointsCard locale={locale} balance={customer?.pointsBalance ?? 0} expirySummary={expirySummary} />

        <div className="mt-6 flex flex-col gap-3">
          {rewards.length === 0 && <p className="text-center text-sm text-gray-400">{t("noRewardsAvailable")}</p>}
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={{
                id: reward.id,
                name: reward.name,
                description: reward.description,
                pointsCost: reward.pointsCost,
                stock: reward.stock,
                imageUrl: reward.imageUrl,
              }}
              customerBalance={customer?.pointsBalance ?? 0}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
