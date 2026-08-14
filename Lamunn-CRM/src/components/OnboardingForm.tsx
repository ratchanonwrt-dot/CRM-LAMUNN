"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

interface Initial {
  name: string;
  dateOfBirth: string; // "" or "YYYY-MM-DD"
  gender: string;
  needsPdpaConsent: boolean;
  needsTosConsent: boolean;
  isReconfirm: boolean; // true when re-prompting an existing customer for DOB only
}

export default function OnboardingForm({ initial, callbackUrl }: { initial: Initial; callbackUrl: string }) {
  const { t } = useLocale();
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth);
  const [gender, setGender] = useState(initial.gender);
  const [consented, setConsented] = useState(!initial.needsPdpaConsent);
  const [tosConsented, setTosConsented] = useState(!initial.needsTosConsent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (initial.needsPdpaConsent && !consented) {
      setError(t("pdpaConsentRequiredError"));
      return;
    }
    if (initial.needsTosConsent && !tosConsented) {
      setError(t("tosConsentRequiredError"));
      return;
    }
    setError(null);
    setLoading(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        dateOfBirth,
        gender: gender || undefined,
        consented: initial.needsPdpaConsent ? consented : undefined,
        tosConsented: initial.needsTosConsent ? tosConsented : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("saveFailedError"));
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-brand-700">{initial.isReconfirm ? t("confirmDobTitle") : t("welcomeTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{initial.isReconfirm ? t("confirmDobDesc") : t("welcomeDesc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("nameLabel")}</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("dobLabel")}</label>
          <input
            required
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <p className="mt-1 text-xs text-gray-400">{t("dobLockedNote")}</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("genderLabel")}</label>
          <select
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          >
            <option value="" disabled>
              —
            </option>
            <option value="FEMALE">{t("genderFemale")}</option>
            <option value="MALE">{t("genderMale")}</option>
            <option value="LGBTQ">{t("genderLgbtq")}</option>
            <option value="UNSPECIFIED">{t("genderUnspecified")}</option>
          </select>
        </div>

        {initial.needsPdpaConsent && (
          <label className="flex items-start gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            {t("pdpaConsentText")}
          </label>
        )}

        {initial.needsTosConsent && (
          <label className="flex items-start gap-2 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={tosConsented}
              onChange={(e) => setTosConsented(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            {t("tosConsentText")}
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white disabled:opacity-50">
          {loading ? t("savingText") : t("startButton")}
        </button>
      </form>
    </main>
  );
}
