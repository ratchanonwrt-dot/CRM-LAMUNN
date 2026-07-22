import { Award, Coins, Lock, CheckCircle2 } from "lucide-react";
import type { MembershipTier } from "@lamunn/db";
import { translate, type Locale } from "@/lib/i18n";

export default function MembershipCardView({
  locale,
  tiers,
  currentTier,
  nextTierInfo,
  pointsBalance,
  lifetimePoints,
}: {
  locale: Locale;
  tiers: MembershipTier[];
  currentTier: MembershipTier | null;
  nextTierInfo: MembershipTier | null;
  pointsBalance: number;
  lifetimePoints: number;
}) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(locale, key, vars);

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative flex h-48 flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-lg"
        style={
          currentTier?.imageUrl
            ? { backgroundImage: `url(${currentTier.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        {!currentTier?.imageUrl && <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800" />}
        {currentTier?.imageUrl && <div className="absolute inset-0 bg-black/30" />}

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs text-white/80">{t("currentTierLabel")}</p>
            <p className="text-2xl font-bold">{currentTier ? currentTier.name : t("noTierYet")}</p>
          </div>
          <Award size={28} className="text-white/90" />
        </div>

        <div className="relative flex items-center gap-2 self-start rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
          <Coins size={16} />
          <span className="text-sm font-semibold">
            {pointsBalance} {t("pointsUnit")}
          </span>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        {nextTierInfo ? (
          <p>{t("pointsToNextTierPrefix", { points: Math.max(nextTierInfo.minPoints - lifetimePoints, 0), tier: nextTierInfo.name })}</p>
        ) : (
          tiers.length > 0 && <p>{t("maxTierReached")}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {t("lifetimePointsLabel")}: {lifetimePoints}
        </p>
      </div>

      {tiers.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">{t("allTiersHeading")}</h2>
          <div className="flex flex-col gap-2">
            {tiers.map((tier) => {
              const achieved = lifetimePoints >= tier.minPoints;
              const isCurrent = currentTier?.id === tier.id;
              return (
                <div
                  key={tier.id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    isCurrent ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white"
                  }`}
                >
                  {tier.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tier.imageUrl} alt={tier.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${achieved ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-300"}`}>
                      <Award size={18} />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${achieved ? "text-gray-800" : "text-gray-400"}`}>{tier.name}</p>
                    <p className="text-xs text-gray-400">
                      {tier.minPoints} {t("pointsUnit")}
                      {tier.benefit ? ` · ${t("benefitLabel")}: ${tier.benefit}` : ""}
                    </p>
                  </div>
                  {achieved ? <CheckCircle2 size={18} className="text-brand-500" /> : <Lock size={16} className="text-gray-300" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
