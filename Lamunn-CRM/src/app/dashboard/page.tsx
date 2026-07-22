import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma, expireOldPoints, getExpirySummary, getAppSettings } from "@lamunn/db";
import HeroBanner from "@/components/HeroBanner";
import GreetingPointsCard from "@/components/GreetingPointsCard";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";
import { History, PlusCircle, Gift, SlidersHorizontal, XCircle, Inbox } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { resolveText } from "@/lib/content";

const typeIcon: Record<string, { icon: typeof PlusCircle; className: string }> = {
  EARN: { icon: PlusCircle, className: "bg-brand-100 text-brand-500" },
  REDEEM: { icon: Gift, className: "bg-violet-100 text-violet-400" },
  ADJUST: { icon: SlidersHorizontal, className: "bg-sky-100 text-sky-400" },
  VOID: { icon: XCircle, className: "bg-rose-100 text-rose-400" },
};

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
      <HeroBanner imageUrl={settings.heroImageUrl} appName={settings.appName} tagline={resolveText(settings, locale, "tagline")} />
      <main className="mx-auto max-w-md px-4 pb-24 pt-0">
        <GreetingPointsCard locale={locale} settings={settings} balance={customer?.pointsBalance ?? 0} expirySummary={expirySummary} />

        <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <History size={18} className="text-gray-400" />
          {t("recentHistory")}
        </h2>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <Inbox size={28} className="text-gray-300" />
            <p className="text-sm text-gray-400">{t("noTransactions")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const { icon: Icon, className } = typeIcon[tx.type] ?? typeIcon.ADJUST;
              return (
                <li key={tx.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <div className="flex-1">
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
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </>
  );
}
