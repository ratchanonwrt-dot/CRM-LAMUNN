"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { useLocale } from "@/components/LanguageProvider";

export default function BottomNav() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: t("navHome"), icon: "🏠" },
    { href: "/rewards", label: t("navRedeem"), icon: "🎁" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
              pathname === tab.href ? "text-brand-700" : "text-gray-400"
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-1.5">
        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500"
        >
          {locale === "th" ? "ไทย" : "EN"}
        </button>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="text-[11px] text-gray-400">
          {t("signOut")}
        </button>
      </div>
    </nav>
  );
}
