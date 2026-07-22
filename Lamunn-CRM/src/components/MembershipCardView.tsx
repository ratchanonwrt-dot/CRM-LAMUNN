import { Award, Coins, Lock, CheckCircle2 } from "lucide-react";
import type { MembershipTier } from "@lamunn/db";
import { translate, type Locale } from "@/lib/i18n";

// Temporary placeholder colors per tier name, used until real card images are uploaded.
const TIER_CARD_GRADIENTS: Record<string, string> = {
  bronze: "from-amber-700 via-amber-800 to-amber-950",
  silver: "from-slate-300 via-slate-400 to-slate-600",
  gold: "from-yellow-400 via-amber-400 to-amber-600",
  diamond: "from-sky-300 via-cyan-400 to-blue-600",
};
const DEFAULT_CARD_GRADIENT = "from-brand-500 to-brand-800";

const TIER_ICON_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-slate-200 text-slate-500",
  gold: "bg-yellow-100 text-yellow-600",
  diamond: "bg-sky-100 text-sky-500",
};
const DEFAULT_ICON_COLOR = "bg-amber-100 text-amber-500";

function getTierCardGradient(name?: string | null) {
  return TIER_CARD_GRADIENTS[name?.trim().toLowerCase() ?? ""] ?? DEFAULT_CARD_GRADIENT;
}

function getTierIconColor(name?: string | null) {
  return TIER_ICON_COLORS[name?.trim().toLowerCase() ?? ""] ?? DEFAULT_ICON_COLOR;
}

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
        {!currentTier?.imageUrl && (
          <div className={`absolute inset-0 bg-gradient-to-br ${getTierCardGradient(currentTier?.name)}`} />
        )}
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
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${achieved ? getTierIconColor(tier.name) : "bg-gray-100 text-gray-300"}`}>
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
