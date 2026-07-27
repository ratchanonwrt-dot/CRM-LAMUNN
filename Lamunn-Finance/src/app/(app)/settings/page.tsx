import { requirePageRole } from "@/lib/requirePageRole";
import { getAllSettings } from "@/lib/settings";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  await requirePageRole(["ADMIN"]);
  const settings = await getAllSettings();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-bold text-gray-800">ตั้งค่าระบบ</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
