import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@lamunn/db";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  const callbackUrl = searchParams.callbackUrl || "/dashboard";

  const session = await getServerSession(authOptions);
  const customerId = session?.user?.customerId;
  if (!customerId) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  // Already fully set up — nothing for this page to collect, so don't show it again.
  if (customer.firstName && customer.lastName && customer.dateOfBirthConfirmedAt) redirect(callbackUrl);

  const initial = {
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.toISOString().slice(0, 10) : "",
    gender: customer.gender ?? "",
    needsPdpaConsent: !customer.pdpaConsentedAt,
    needsTosConsent: !customer.tosConsentedAt,
    // If they already have a name (so this isn't a brand-new signup) but their DOB was
    // never confirmed, this is the one-time re-confirmation prompt, not first-time onboarding.
    isReconfirm: !!(customer.firstName && customer.lastName) && !customer.dateOfBirthConfirmedAt,
  };

  return <OnboardingForm initial={initial} callbackUrl={callbackUrl} />;
}
