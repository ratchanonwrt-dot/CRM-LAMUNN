import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints, getExpirySummary, getAppSettings, getMembershipTiers, nextTier } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import GreetingPointsCard from "@/components/GreetingPointsCard";
import MembershipCardView from "@/components/MembershipCardView";
import { getLocale } from "@/lib/i18n-server";
import { resolveText } from "@/lib/content";

export default async function DashboardPage() {
  const locale = getLocale();

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const [customerCheck] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    expireOldPoints(customerId),
  ]);
  if (!customerCheck?.name || !customerCheck.dateOfBirthConfirmedAt) redirect("/onboarding?callbackUrl=/dashboard");

  const [customer, expirySummary, settings, tiers] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId }, include: { currentTier: true } }),
    getExpirySummary(customerId),
    getAppSettings(),
    getMembershipTiers(),
  ]);

  const lifetimePoints = customer?.lifetimePoints ?? 0;
  const currentTier = customer?.currentTier ?? null;
  const nextTierInfo = nextTier(lifetimePoints, tiers);

  return (
    <>
      <HeroBanner imageUrl={settings.heroImageUrl} appName={settings.appName} tagline={resolveText(settings, locale, "tagline")} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <GreetingPointsCard locale={locale} settings={settings} balance={customer?.pointsBalance ?? 0} expirySummary={expirySummary} />

        <div className="mt-6">
          <MembershipCardView
            locale={locale}
            tiers={tiers}
            currentTier={currentTier}
            nextTierInfo={nextTierInfo}
            pointsBalance={customer?.pointsBalance ?? 0}
            lifetimePoints={lifetimePoints}
          />
        </div>
      </main>
    </>
  );
}
