import { cookies } from "next/headers";
import { LOCALE_COOKIE, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

/** Server-only helper: reads the locale cookie. Use in Server Components / Route Handlers only
 * — importing this from a client component (even transitively) breaks the client bundle. */
export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
