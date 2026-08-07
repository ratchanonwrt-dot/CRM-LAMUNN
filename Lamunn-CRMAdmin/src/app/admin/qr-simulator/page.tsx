import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import QrSimulatorClient from "@/components/QrSimulatorClient";

// Removed from the nav per request — kept reachable by direct URL for SUPER_ADMIN
// only, since it's a dev/testing tool rather than a day-to-day feature.
export default async function QrSimulatorPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/admin");
  return <QrSimulatorClient />;
}
