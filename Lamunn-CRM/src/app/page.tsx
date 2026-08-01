import Link from "next/link";
import Image from "next/image";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { getAppSettings } from "@lamunn/db";
import { resolveText } from "@/lib/content";
import LanguageSwitch from "@/components/LanguageSwitch";

export default async function HomePage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const settings = await getAppSettings();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex w-full justify-end">
        <LanguageSwitch />
      </div>
      <Image
        src={settings.logoImageUrl ?? "/logo-mark.jpg"}
        alt={settings.appName ?? "Lamunn"}
        width={112}
        height={112}
        priority
        className="h-28 w-28 rounded-3xl object-cover shadow-lg shadow-brand-900/10 ring-1 ring-brand-100"
      />
      <h1 className="text-2xl font-bold text-brand-700">{settings.appName ?? t("appTitle")}</h1>
      <p className="text-gray-600">{resolveText(settings, locale, "tagline")}</p>
      <Link
        href="/login"
        className="w-full rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
      >
        {t("customerLoginButton")}
      </Link>
    </main>
  );
}
