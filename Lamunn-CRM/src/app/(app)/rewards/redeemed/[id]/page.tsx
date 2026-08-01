import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function RedeemedPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const statusLabel: Record<string, string> = {
    PENDING: t("statusPending"),
    COMPLETED: t("statusCompleted"),
    CANCELLED: t("statusCancelled"),
  };

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const redemption = await prisma.redemption.findUnique({
    where: { id: params.id },
    include: { reward: true, branch: true },
  });

  if (!redemption || redemption.customerId !== customerId) notFound();

  const confirmUrl = `${process.env.ADMIN_APP_URL}/admin/redemptions/${redemption.id}`;
  const qrDataUrl = await QRCode.toDataURL(confirmUrl, { width: 300 });

  return (
    <>
      <main className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-8 pb-24 text-center">
        <h1 className="text-xl font-bold text-brand-700">{t("redeemSuccessTitle")}</h1>
        <p className="text-gray-600">
          {redemption.reward.name} · {t("usedPrefix")} {redemption.pointsSpent} {t("pointsUnit")}
        </p>

        {redemption.status === "PENDING" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt={t("qrAlt")} className="h-64 w-64 rounded-xl border border-gray-200" />
        )}

        <p
          className={
            redemption.status === "COMPLETED"
              ? "font-semibold text-brand-700"
              : redemption.status === "CANCELLED"
                ? "font-semibold text-red-600"
                : "text-gray-500"
          }
        >
          {statusLabel[redemption.status] ?? redemption.status}
        </p>

        {redemption.status === "PENDING" && (
          <p className="text-sm text-gray-400">{t("showQrHint")}</p>
        )}
      </main>
    </>
  );
}
