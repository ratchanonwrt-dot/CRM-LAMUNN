import { getAppSettings } from "@lamunn/db";
import HeroImageSettingsForm from "@/components/HeroImageSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ตั้งค่าหน้าตาแอป</h1>
      <HeroImageSettingsForm initialImageUrl={settings.heroImageUrl} />
    </div>
  );
}
