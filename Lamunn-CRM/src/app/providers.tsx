"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export default function Providers({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <SessionProvider>{children}</SessionProvider>
    </LanguageProvider>
  );
}
