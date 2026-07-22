import { format } from "date-fns";
import { Coins, Clock3 } from "lucide-react";
import { translate, type Locale } from "@/lib/i18n";

function getGreetingKey(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour >= 5 && hour < 11) return "greetingMorning";
  if (hour >= 11 && hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

const greetingEmoji = {
  greetingMorning: "🌅",
  greetingAfternoon: "☀️",
  greetingEvening: "🌙",
} as const;

export default function GreetingPointsCard({
  locale,
  balance,
  expirySummary,
}: {
  locale: Locale;
  balance: number;
  expirySummary: { points: number; expiresAt: Date } | null;
}) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(locale, key, vars);
  const greetingKey = getGreetingKey(new Date().getHours());

  return (
    <div className="-mt-6 mx-4 rounded-2xl bg-white p-5 shadow-md">
      <p className="text-sm text-gray-500">
        {greetingEmoji[greetingKey]} {t(greetingKey)} {t("welcomeSuffix")}
      </p>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-400">
          <Coins size={20} strokeWidth={2.2} />
        </div>
        <p className="text-sm font-medium text-gray-700">
          {t("pointsRemainingLabel")} <span className="text-xl font-bold text-brand-700">{balance}</span> {t("pointsUnit")}
        </p>
      </div>

      {expirySummary && (
        <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Clock3 size={12} />
          {t("expiresOnPrefix", { points: expirySummary.points, date: format(expirySummary.expiresAt, "d MMM yyyy") })}
        </p>
      )}
    </div>
  );
}
