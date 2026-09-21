import { requireSectionPage } from "@/lib/permissions";
import WhtReportView from "@/components/accounting/WhtReportView";

export const dynamic = "force-dynamic";

export default async function PND3Page({ searchParams }: { searchParams: { year?: string; month?: string } }) {
  const { permissions } = await requireSectionPage("ACCOUNTING");
  return (
    <WhtReportView
      formType="PND3"
      basePath="/accounting/tax-reports/pnd3"
      canEdit={permissions.ACCOUNTING.canEdit}
      searchParams={searchParams}
    />
  );
}
