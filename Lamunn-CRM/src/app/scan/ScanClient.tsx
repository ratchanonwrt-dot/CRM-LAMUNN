"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

type Step = "phone" | "profile" | "submitting";
type ScanState =
  | { status: "form" }
  | { status: "success"; pointsEarned: number; newBalance: number; branchName: string }
  | { status: "error"; message: string };

export default function ScanClient({ logoUrl }: { logoUrl: string }) {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const qrQuery = searchParams.toString();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [consented, setConsented] = useState(false);
  const [tosConsented, setTosConsented] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [state, setState] = useState<ScanState>({ status: "form" });

  async function submit(extra?: { firstName: string; lastName: string; dateOfBirth: string; gender: string; consented: boolean; tosConsented: boolean }) {
    setStep("submitting");
    const res = await fetch("/api/points/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qr: qrQuery, phone, ...extra }),
    });
    const data = await res.json();
    if (res.ok) {
      setState({ status: "success", pointsEarned: data.pointsEarned, newBalance: data.newBalance, branchName: data.branchName });
      return;
    }
    if (data.code === "NEEDS_PROFILE") {
      setStep("profile");
      return;
    }
    setState({ status: "error", message: data.error ?? t("scanGenericError") });
  }

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consented) {
      setProfileError(t("pdpaConsentRequiredError"));
      return;
    }
    if (!tosConsented) {
      setProfileError(t("tosConsentRequiredError"));
      return;
    }
    setProfileError(null);
    submit({ firstName, lastName, dateOfBirth, gender, consented, tosConsented });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex w-full justify-end">
        <LanguageSwitch />
      </div>

      <Image
        src={logoUrl}
        alt="Lamunn"
        width={80}
        height={80}
        priority
        className="h-20 w-20 rounded-3xl object-cover shadow-lg shadow-brand-900/10 ring-1 ring-brand-100"
      />

      {state.status === "form" && step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="flex w-full flex-col gap-4">
          <h1 className="text-xl font-bold text-brand-700">{t("scanPhoneTitle")}</h1>
          <input
            required
            type="tel"
            placeholder="08xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-center text-lg"
          />
          <button type="submit" className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white">
            {t("earnPointsButton")}
          </button>
        </form>
      )}

      {state.status === "form" && step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="flex w-full flex-col gap-4">
          <h1 className="text-xl font-bold text-brand-700">{t("newCustomerTitle")}</h1>
          <p className="text-sm text-gray-500">{t("newCustomerDesc", { phone })}</p>
          <input
            required
            placeholder={t("firstNameLabel")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-center"
          />
          <input
            required
            placeholder={t("lastNameLabel")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-center"
          />
          <div className="text-left">
            <label className="mb-1 block text-sm font-medium text-gray-700">{t("dobLabel")}</label>
            <input
              required
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center"
            />
          </div>
          <select
            required
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 text-center"
          >
            <option value="" disabled>
              {t("genderLabel")}
            </option>
            <option value="FEMALE">{t("genderFemale")}</option>
            <option value="MALE">{t("genderMale")}</option>
            <option value="LGBTQ">{t("genderLgbtq")}</option>
            <option value="UNSPECIFIED">{t("genderUnspecified")}</option>
          </select>

          <label className="flex items-start gap-2 text-left text-xs text-gray-500">
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            {t("pdpaConsentText")}
          </label>

          <label className="flex items-start gap-2 text-left text-xs text-gray-500">
            <input
              type="checkbox"
              checked={tosConsented}
              onChange={(e) => setTosConsented(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            {t("tosConsentText")}
          </label>

          {profileError && <p className="text-sm text-red-600">{profileError}</p>}

          <button type="submit" className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white">
            {t("signupAndEarnButton")}
          </button>
        </form>
      )}

      {state.status === "form" && step === "submitting" && <p className="text-gray-500">{t("processingText")}</p>}

      {state.status === "success" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-4xl">🎉</div>
          <h1 className="text-xl font-bold text-brand-700">{t("earnSuccessTitle")}</h1>
          <p className="text-sm text-gray-500">{t("earnSuccessSubtitle")}</p>
          <p className="text-gray-600">
            {t("earnedPrefix")} <span className="font-semibold text-brand-700">{state.pointsEarned} {t("pointsUnit")}</span> {t("fromBranch")}{" "}
            {state.branchName}
          </p>
          <p className="text-sm text-gray-500">
            {t("totalPointsNowPrefix")} {state.newBalance} {t("pointsUnit")}
          </p>
          <Link href="/login" className="mt-2 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white">
            {t("loginToViewButton")}
          </Link>
        </>
      )}

      {state.status === "error" && (
        <>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-red-700">{t("earnFailedTitle")}</h1>
          <p className="text-gray-600">{state.message}</p>
        </>
      )}
    </main>
  );
}
