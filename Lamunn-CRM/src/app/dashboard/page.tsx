import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints, getExpirySummary, getAppSettings } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import GreetingPointsCard from "@/components/GreetingPointsCard";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";

export default async function DashboardPage() {
  const locale = getLocale();
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const typeLabel: Record<string, string> = {
    EARN: t("typeEarn"),
    REDEEM: t("typeRedeem"),
    ADJUST: t("typeAdjust"),
    VOID: t("typeVoid"),
  };

  const session = await getServerSession(authOptions);
  const customerId = session!.user.customerId!;

  const customerCheck = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customerCheck?.name || !customerCheck.dateOfBirth) redirect("/onboarding?callbackUrl=/dashboard");

  await expireOldPoints(customerId);

  const [customer, transactions, expirySummary, settings] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.pointTransaction.findMany({
      where: { customerId },
      include: { branch: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    getExpirySummary(customerId),
    getAppSettings(),
  ]);

  return (
    <>
      <HeroBanner imageUrl={settings.heroImageUrl} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <GreetingPointsCard locale={locale} balance={customer?.pointsBalance ?? 0} expirySummary={expirySummary} />

        <h2 className="mb-3 mt-8 text-lg font-semibold text-gray-800">{t("recentHistory")}</h2>
        <ul className="flex flex-col gap-2">
          {transactions.length === 0 && <p className="text-sm text-gray-400">{t("noTransactions")}</p>}
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{typeLabel[tx.type] ?? tx.type}</p>
                <p className="text-xs text-gray-400">
                  {tx.branch?.name ?? t("noBranch")} · {format(tx.createdAt, "d MMM yyyy HH:mm")}
                </p>
              </div>
              <span className={tx.points >= 0 ? "font-semibold text-brand-700" : "font-semibold text-red-600"}>
                {tx.points >= 0 ? "+" : ""}
                {tx.points}
              </span>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </>
  );
}
