"use client";

import { useLocale } from "@/components/LanguageProvider";
import clsx from "clsx";

export default function LanguageSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="inline-flex overflow-hidden rounded-full border border-gray-200 text-xs font-medium">
      <button
        onClick={() => setLocale("th")}
        className={clsx("px-2.5 py-1", locale === "th" ? "bg-brand-600 text-white" : "bg-white text-gray-500")}
      >
        ไทย
      </button>
      <button
        onClick={() => setLocale("en")}
        className={clsx("px-2.5 py-1", locale === "en" ? "bg-brand-600 text-white" : "bg-white text-gray-500")}
      >
        EN
      </button>
    </div>
  );
}
