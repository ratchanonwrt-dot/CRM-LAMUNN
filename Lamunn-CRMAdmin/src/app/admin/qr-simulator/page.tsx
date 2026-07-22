import { requirePageRole } from "@/lib/requirePageRole";
import QrSimulatorClient from "@/components/QrSimulatorClient";

export default async function QrSimulatorPage() {
  await requirePageRole(["SUPER_ADMIN"]);
  return <QrSimulatorClient />;
}
