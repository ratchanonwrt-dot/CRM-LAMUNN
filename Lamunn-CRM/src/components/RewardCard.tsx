"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Gift } from "lucide-react";
import { useLocale } from "@/components/LanguageProvider";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  stock: number | null;
  imageUrl: string | null;
}

const PLACEHOLDER_COLORS = [
  "bg-brand-100 text-brand-300",
  "bg-pink-100 text-pink-300",
  "bg-amber-100 text-amber-400",
  "bg-sky-100 text-sky-300",
  "bg-violet-100 text-violet-300",
];

function placeholderColor(id: string) {
  const sum = id.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
}

export default function RewardCard({ reward, customerBalance }: { reward: Reward; customerBalance: number }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const canAfford = customerBalance >= reward.pointsCost;
  const outOfStock = reward.stock !== null && reward.stock <= 0;

  async function handleRedeem() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/customer/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId: reward.id }),
    });
    const data = await res.json();
    setLoading(false);
    setConfirming(false);
    if (!res.ok) {
      setError(data.error ?? t("redeemFailedError"));
      return;
    }
    router.push(`/rewards/redeemed/${data.redemptionId}`);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {reward.imageUrl ? (
          <Image src={reward.imageUrl} alt={reward.name} width={64} height={64} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${placeholderColor(reward.id)}`}>
            <Gift size={26} strokeWidth={2.2} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{reward.name}</h3>
          {reward.description && <p className="mt-1 text-sm text-gray-500">{reward.description}</p>}
        </div>
      </div>
      {confirming ? (
        <div className="mt-3 rounded-lg bg-amber-50 p-3">
          <p className="text-xs font-medium text-amber-800">{t("redeemConfirmTitle")}</p>
          <p className="mt-1 text-xs text-amber-700">{t("redeemConfirmBody", { points: reward.pointsCost })}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="flex-1 rounded-full border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 disabled:opacity-50"
            >
              {t("redeemCancelButton")}
            </button>
            <button
              onClick={handleRedeem}
              disabled={loading}
              className="flex-1 rounded-full bg-brand-600 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {loading ? t("redeeming") : t("redeemConfirmButton")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={!canAfford || outOfStock}
          className="mt-3 w-full rounded-full border border-brand-200 bg-brand-50 py-2 text-sm font-medium text-brand-700 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {outOfStock ? t("outOfStock") : `${t("useLabel")} ${reward.pointsCost} ${t("pointsUnit")}`}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
