"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Locale, TranslationKey } from "@/lib/i18n";

export default function Providers({
  initialLocale,
  navOverrides,
  children,
}: {
  initialLocale: Locale;
  navOverrides?: Partial<Record<Locale, Partial<Record<TranslationKey, string>>>>;
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale} overrides={navOverrides}>
      <SessionProvider>{children}</SessionProvider>
    </LanguageProvider>
  );
}
