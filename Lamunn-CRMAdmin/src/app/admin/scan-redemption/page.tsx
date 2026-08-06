import { requirePageRole } from "@/lib/requirePageRole";
import QrRedemptionScanner from "@/components/QrRedemptionScanner";

export default async function ScanRedemptionPage() {
  await requirePageRole(["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"]);
  return <QrRedemptionScanner />;
}
