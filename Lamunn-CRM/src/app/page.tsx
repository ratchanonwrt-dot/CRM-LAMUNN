import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function HomePage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex w-full justify-end">
        <LanguageSwitch />
      </div>
      <h1 className="text-2xl font-bold text-brand-700">{t("appTitle")}</h1>
      <p className="text-gray-600">{t("appTagline")}</p>
      <Link
        href="/login"
        className="w-full rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
      >
        {t("customerLoginButton")}
      </Link>
    </main>
  );
}
