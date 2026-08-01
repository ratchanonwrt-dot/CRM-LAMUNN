import { getAppSettings } from "@lamunn/db";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const settings = await getAppSettings();
  return <LoginClient logoUrl={settings.logoImageUrl ?? "/logo-mark.jpg"} />;
}
