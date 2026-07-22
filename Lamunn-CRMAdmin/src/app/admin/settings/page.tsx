import { getAppSettings, getMembershipTiers } from "@lamunn/db";
import HeroImageSettingsForm from "@/components/HeroImageSettingsForm";
import SiteContentForm from "@/components/SiteContentForm";
import TierImagesSettingsForm from "@/components/TierImagesSettingsForm";

export default async function AdminSettingsPage() {
  const [settings, tiers] = await Promise.all([getAppSettings(), getMembershipTiers()]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-800">ตั้งค่าหน้าตาแอป</h1>
      <HeroImageSettingsForm initialImageUrl={settings.heroImageUrl} />
      <div className="mt-4">
        <TierImagesSettingsForm tiers={tiers.map((t) => ({ id: t.id, name: t.name, imageUrl: t.imageUrl }))} />
      </div>
      <SiteContentForm
        initial={{
          appName: settings.appName,
          taglineTh: settings.taglineTh,
          taglineEn: settings.taglineEn,
          greetingMorningTh: settings.greetingMorningTh,
          greetingMorningEn: settings.greetingMorningEn,
          greetingAfternoonTh: settings.greetingAfternoonTh,
          greetingAfternoonEn: settings.greetingAfternoonEn,
          greetingEveningTh: settings.greetingEveningTh,
          greetingEveningEn: settings.greetingEveningEn,
          navHomeTh: settings.navHomeTh,
          navHomeEn: settings.navHomeEn,
          navRedeemTh: settings.navRedeemTh,
          navRedeemEn: settings.navRedeemEn,
        }}
      />
    </div>
  );
}
