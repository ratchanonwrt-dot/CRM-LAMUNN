import { requirePageRole } from "@/lib/requirePageRole";
import QrRedemptionScanner from "@/components/QrRedemptionScanner";

export default async function ScanRedemptionPage() {
  await requirePageRole("scanRedemption");
  return <QrRedemptionScanner />;
}
