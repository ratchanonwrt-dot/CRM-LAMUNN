import { format } from "date-fns";
import { Coins, Clock3 } from "lucide-react";
import type { AppSettings } from "@lamunn/db";
import { translate, type Locale } from "@/lib/i18n";
import { resolveText } from "@/lib/content";

function getGreetingKey(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour >= 5 && hour < 11) return "greetingMorning";
  if (hour >= 11 && hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

// Runs server-side on Vercel, whose machines run in UTC — new Date().getHours()
// would give the wrong greeting for Thai customers, so read the hour in
// Asia/Bangkok explicitly instead of the server's local time.
function getBangkokHour(): number {
  const hourPart = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", hour: "numeric", hour12: false }).formatToParts(new Date()).find((p) => p.type === "hour");
  return hourPart ? Number(hourPart.value) % 24 : new Date().getHours();
}

const greetingEmoji = {
  greetingMorning: "🌅",
  greetingAfternoon: "☀️",
  greetingEvening: "🌙",
} as const;

export default function GreetingPointsCard({
  locale,
  settings,
  balance,
  expirySummary,
}: {
  locale: Locale;
  settings: AppSettings;
  balance: number;
  expirySummary: { points: number; expiresAt: Date } | null;
}) {
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(locale, key, vars);
  const greetingKey = getGreetingKey(getBangkokHour());
  const greetingText = resolveText(settings, locale, greetingKey);

  return (
    <div className="mx-4 mt-5 rounded-2xl bg-white p-5 shadow-md">
      <p className="text-sm text-gray-500">
        {greetingEmoji[greetingKey]} {greetingText}
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
