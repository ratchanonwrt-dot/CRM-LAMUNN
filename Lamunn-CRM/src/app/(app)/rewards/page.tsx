import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints, getExpirySummary, getAppSettings } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import GreetingPointsCard from "@/components/GreetingPointsCard";
import RewardCard from "@/components/RewardCard";
import { Gift, PackageOpen } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { resolveText } from "@/lib/content";

export default async function RewardsPage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const [customerCheck] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    expireOldPoints(customerId),
  ]);
  if (!customerCheck?.name || !customerCheck.dateOfBirth) redirect("/onboarding?callbackUrl=/rewards");

  const [rewards, customer, expirySummary, settings] = await Promise.all([
    prisma.reward.findMany({ where: { isActive: true, kind: "REWARD" }, orderBy: { pointsCost: "asc" } }),
    prisma.customer.findUnique({ where: { id: customerId } }),
    getExpirySummary(customerId),
    getAppSettings(),
  ]);

  return (
    <>
      <HeroBanner imageUrl={settings.heroImageUrl} appName={settings.appName} tagline={resolveText(settings, locale, "tagline")} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <GreetingPointsCard locale={locale} settings={settings} balance={customer?.pointsBalance ?? 0} expirySummary={expirySummary} />

        <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Gift size={18} className="text-gray-400" />
          {t("navRedeem")}
          {rewards.length > 0 && <span className="text-sm font-normal text-gray-400">({rewards.length})</span>}
        </h2>

        {rewards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <PackageOpen size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">{t("noRewardsAvailable")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={{
                  id: reward.id,
                  name: reward.name,
                  description: reward.description,
                  pointsCost: reward.pointsCost ?? 0,
                  stock: reward.stock,
                  imageUrl: reward.imageUrl,
                }}
                customerBalance={customer?.pointsBalance ?? 0}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
