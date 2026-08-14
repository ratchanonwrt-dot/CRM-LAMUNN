import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma, getAppSettings, type Redemption, type Reward } from "@lamunn/db";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { resolveText } from "@/lib/content";
import HeroBanner from "@/components/HeroBanner";
import { Gift, Ticket } from "lucide-react";

type RedemptionWithReward = Redemption & { reward: Reward | null };

export default async function CouponsPage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(locale, key, vars);
  const statusLabel: Record<string, string> = {
    PENDING: t("statusPending"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const customerCheck = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customerCheck?.name || !customerCheck.dateOfBirthConfirmedAt) redirect("/onboarding?callbackUrl=/coupons");

  const [redemptions, settings] = await Promise.all([
    prisma.redemption.findMany({
      where: { customerId },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
    getAppSettings(),
  ]);

  // Reward redemptions (points spent, 1-hour QR window) and auto/manually
  // granted vouchers (free, longer expiry) are two separate systems — kept in
  // their own sections here so customers don't confuse a spent-points reward
  // with a free tier voucher.
  const redeemedRewards = redemptions.filter((r) => r.pointsSpent > 0);
  const vouchers = redemptions.filter((r) => r.pointsSpent === 0);

  function renderCard(r: RedemptionWithReward) {
    const isExpired = r.status === "PENDING" && r.expiresAt !== null && r.expiresAt < new Date();
    return (
      <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          {r.reward?.imageUrl ? (
            <Image src={r.reward.imageUrl} alt={r.rewardName} width={56} height={56} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-300">
              <Gift size={24} strokeWidth={2.2} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{r.reward?.name ?? r.rewardName}</h3>
            {r.reward?.discountPercent != null ? (
              <p className="mt-0.5 text-xs font-medium text-amber-600">
                {t("discountBadge", { percent: r.reward.discountPercent })}
                {r.reward.discountMaxAmount ? ` · ${t("discountMaxNote", { amount: Number(r.reward.discountMaxAmount).toLocaleString(locale === "th" ? "th-TH" : "en-US") })}` : ""}
              </p>
            ) : r.reward?.discountAmount != null ? (
              <p className="mt-0.5 text-xs font-medium text-amber-600">
                {t("discountAmountBadge", { amount: Number(r.reward.discountAmount).toLocaleString(locale === "th" ? "th-TH" : "en-US") })}
                {r.reward.minSpendAmount ? ` · ${t("minSpendNote", { amount: Number(r.reward.minSpendAmount).toLocaleString(locale === "th" ? "th-TH" : "en-US") })}` : ""}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-gray-400">{r.pointsSpent > 0 ? `${t("usedPrefix")} ${r.pointsSpent} ${t("pointsUnit")}` : t("freeGiftLabel")}</p>
            <p
              className={
                r.status === "COMPLETED"
                  ? "mt-1 text-xs font-semibold text-brand-700"
                  : r.status === "CANCELLED" || isExpired
                    ? "mt-1 text-xs font-semibold text-red-600"
                    : "mt-1 text-xs font-semibold text-gray-500"
              }
            >
              {isExpired ? t("voucherExpired") : statusLabel[r.status] ?? r.status}
            </p>
            {r.status === "PENDING" && !isExpired && r.expiresAt && (
              <p className="mt-0.5 text-xs text-gray-400">{t("voucherExpiresOn", { date: format(r.expiresAt, "d MMM yyyy HH:mm") })}</p>
            )}
          </div>
        </div>
        {r.status === "PENDING" && !isExpired && (
          <Link
            href={`/rewards/redeemed/${r.id}`}
            className="mt-3 block w-full rounded-full border border-brand-200 bg-brand-50 py-2 text-center text-sm font-medium text-brand-700"
          >
            {t("viewCoupon")}
          </Link>
        )}
      </li>
    );
  }

  return (
    <>
      <HeroBanner imageUrl={settings.heroImageUrl} appName={settings.appName} tagline={resolveText(settings, locale, "tagline")} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-6">
        <h1 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Ticket size={18} className="text-gray-400" />
          {t("myCouponsTitle")}
        </h1>

        <h2 className="mb-3 text-sm font-semibold text-gray-600">{t("myVouchersSectionTitle")}</h2>
        {vouchers.length === 0 ? (
          <div className="mb-8 flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
            <Ticket size={24} className="text-gray-300" />
            <p className="text-sm text-gray-400">{t("noVouchersYet")}</p>
          </div>
        ) : (
          <ul className="mb-8 flex flex-col gap-3">{vouchers.map(renderCard)}</ul>
        )}

        <h2 className="mb-3 text-sm font-semibold text-gray-600">{t("redeemedRewardsTitle")}</h2>
        {redeemedRewards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
            <Gift size={24} className="text-gray-300" />
            <p className="text-sm text-gray-400">{t("noRedeemedRewards")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">{redeemedRewards.map(renderCard)}</ul>
        )}
      </main>
    </>
  );
}
