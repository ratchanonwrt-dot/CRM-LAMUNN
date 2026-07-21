"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { Home, Gift, Languages, LogOut } from "lucide-react";
import { useLocale } from "@/components/LanguageProvider";

export default function BottomNav() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const tabs = [
    { href: "/dashboard", label: t("navHome"), icon: Home },
    { href: "/rewards", label: t("navRedeem"), icon: Gift },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium",
                active ? "text-brand-700" : "text-gray-400"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-1.5">
        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500"
        >
          <Languages size={12} />
          {locale === "th" ? "ไทย" : "EN"}
        </button>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-1 text-[11px] text-gray-400">
          <LogOut size={12} />
          {t("signOut")}
        </button>
      </div>
    </nav>
  );
}
