"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function CustomerLoginPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestOtp() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("otpRequestFailedError"));
      }
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    setLoading(true);
    const res = await signIn("customer-otp", { phone, code, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) {
      setError(t("otpInvalidError"));
      return;
    }
    window.location.href = callbackUrl;
  }

  const lineLoginEnabled = process.env.NEXT_PUBLIC_LINE_LOGIN_ENABLED === "true";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>

      <h1 className="text-center text-xl font-bold text-brand-700">{t("loginTitle")}</h1>

      {lineLoginEnabled && (
        <>
          <button
            onClick={() => signIn("line", { callbackUrl })}
            className="rounded-lg bg-[#06C755] px-6 py-3 font-medium text-white hover:opacity-90"
          >
            {t("lineLoginButton")}
          </button>

          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            {t("orDivider")}
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xxxxxxxx"
          disabled={otpSent}
          className="rounded-lg border border-gray-300 px-4 py-2 disabled:bg-gray-100"
        />

        {otpSent && (
          <>
            <label className="text-sm font-medium text-gray-700">{t("otpLabel")}</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="rounded-lg border border-gray-300 px-4 py-2 tracking-widest"
            />
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!otpSent ? (
          <button
            onClick={handleRequestOtp}
            disabled={loading || phone.length < 9}
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? t("requestOtpLoading") : t("requestOtpButton")}
          </button>
        ) : (
          <button
            onClick={handleVerifyOtp}
            disabled={loading || code.length < 4}
            className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? t("verifyOtpLoading") : t("verifyOtpButton")}
          </button>
        )}
      </div>
    </main>
  );
}
