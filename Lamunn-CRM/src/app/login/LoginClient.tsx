"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useLocale } from "@/components/LanguageProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function LoginClient({ logoUrl }: { logoUrl: string }) {
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
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-white to-white px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>

        <div className="flex flex-col items-center gap-4">
          <Image
            src={logoUrl}
            alt="Lamunn"
            width={96}
            height={96}
            priority
            className="h-24 w-24 rounded-3xl object-cover shadow-lg shadow-brand-900/10 ring-1 ring-brand-100"
          />
          <h1 className="text-center text-lg font-bold text-brand-700">{t("loginTitle")}</h1>
        </div>

        <div className="rounded-3xl border border-brand-100/60 bg-white p-6 shadow-xl shadow-brand-900/5">
          {lineLoginEnabled && (
            <>
              <button
                onClick={() => signIn("line", { callbackUrl })}
                className="w-full rounded-xl bg-[#06C755] px-6 py-3 font-medium text-white transition hover:opacity-90"
              >
                {t("lineLoginButton")}
              </button>

              <div className="my-4 flex items-center gap-3 text-sm text-gray-400">
                <div className="h-px flex-1 bg-gray-200" />
                {t("orDivider")}
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("phoneLabel")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxx"
                disabled={otpSent}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            {otpSent && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t("otpLabel")}</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-[0.5em] text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {!otpSent ? (
              <button
                onClick={handleRequestOtp}
                disabled={loading || phone.length < 9}
                className="mt-1 w-full rounded-xl bg-brand-600 px-6 py-3 font-medium text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? t("requestOtpLoading") : t("requestOtpButton")}
              </button>
            ) : (
              <button
                onClick={handleVerifyOtp}
                disabled={loading || code.length < 4}
                className="mt-1 w-full rounded-xl bg-brand-600 px-6 py-3 font-medium text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? t("verifyOtpLoading") : t("verifyOtpButton")}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
