import { getAppSettings } from "@lamunn/db";
import ScanClient from "./ScanClient";

export default async function ScanPage() {
  const settings = await getAppSettings();
  return <ScanClient logoUrl={settings.logoImageUrl ?? "/logo-mark.jpg"} />;
}
