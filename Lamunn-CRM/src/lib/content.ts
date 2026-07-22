import type { AppSettings } from "@lamunn/db";
import { translate, type Locale, type TranslationKey } from "@/lib/i18n";

type OverridableKey = "tagline" | "greetingMorning" | "greetingAfternoon" | "greetingEvening" | "navHome" | "navRedeem";

function overrideField(key: OverridableKey, locale: Locale): keyof AppSettings {
  const suffix = locale === "th" ? "Th" : "En";
  return `${key}${suffix}` as keyof AppSettings;
}

const FALLBACK_KEY: Record<OverridableKey, TranslationKey> = {
  tagline: "appTagline",
  greetingMorning: "greetingMorning",
  greetingAfternoon: "greetingAfternoon",
  greetingEvening: "greetingEvening",
  navHome: "navHome",
  navRedeem: "navRedeem",
};

/** Resolves a piece of customer-app copy: an admin-set override in AppSettings if present, else the built-in translation. */
export function resolveText(settings: AppSettings, locale: Locale, key: OverridableKey): string {
  const override = settings[overrideField(key, locale)];
  if (typeof override === "string" && override.trim() !== "") return override;
  return translate(locale, FALLBACK_KEY[key]);
}

/** Builds the { th: {...}, en: {...} } override map handed to LanguageProvider for client-side nav labels. */
export function buildNavOverrides(settings: AppSettings): Partial<Record<Locale, Partial<Record<TranslationKey, string>>>> {
  const pick = (locale: Locale) => {
    const overrides: Partial<Record<TranslationKey, string>> = {};
    const navHome = settings[overrideField("navHome", locale)];
    const navRedeem = settings[overrideField("navRedeem", locale)];
    if (typeof navHome === "string" && navHome.trim() !== "") overrides.navHome = navHome;
    if (typeof navRedeem === "string" && navRedeem.trim() !== "") overrides.navRedeem = navRedeem;
    return overrides;
  };
  return { th: pick("th"), en: pick("en") };
}
