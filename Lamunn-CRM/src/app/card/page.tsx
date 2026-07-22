import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, getMembershipTiers, resolveTier, nextTier, getAppSettings } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import BottomNav from "@/components/BottomNav";
import MembershipCardView from "@/components/MembershipCardView";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { resolveText } from "@/lib/content";

export default async function CardPage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const customerCheck = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customerCheck?.name || !customerCheck.dateOfBirth) redirect("/onboarding?callbackUrl=/card");

  const [customer, tiers, settings] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    getMembershipTiers(),
    getAppSettings(),
  ]);

  const lifetimePoints = customer?.lifetimePoints ?? 0;
  const currentTier = resolveTier(lifetimePoints, tiers);
  const nextTierInfo = nextTier(lifetimePoints, tiers);

  return (
    <>
      <HeroBanner imageUrl={settings.heroImageUrl} appName={settings.appName} tagline={resolveText(settings, locale, "tagline")} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <h1 className="mb-4 text-lg font-semibold text-gray-800">{t("membershipCardTitle")}</h1>
        <MembershipCardView
          locale={locale}
          tiers={tiers}
          currentTier={currentTier}
          nextTierInfo={nextTierInfo}
          pointsBalance={customer?.pointsBalance ?? 0}
          lifetimePoints={lifetimePoints}
        />
      </main>
      <BottomNav />
    </>
  );
}
