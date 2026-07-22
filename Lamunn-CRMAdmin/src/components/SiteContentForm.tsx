"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Type, MessageCircleHeart, ListTree, Save } from "lucide-react";

const DEFAULTS = {
  appName: "Lamunn",
  taglineTh: "ระบบสะสมแต้มลูกค้า สแกน QR ท้ายใบเสร็จเพื่อรับแต้ม",
  taglineEn: "Customer loyalty program — scan the QR on your receipt to earn points",
  greetingMorningTh: "สวัสดีตอนเช้า",
  greetingMorningEn: "Good morning",
  greetingAfternoonTh: "สวัสดีตอนบ่าย",
  greetingAfternoonEn: "Good afternoon",
  greetingEveningTh: "สวัสดีตอนเย็น",
  greetingEveningEn: "Good evening",
  navHomeTh: "หน้าหลัก",
  navHomeEn: "Home",
  navRedeemTh: "แลกรางวัล",
  navRedeemEn: "Redeem Rewards",
} as const;

type FieldKey = keyof typeof DEFAULTS;

interface Props {
  initial: Partial<Record<FieldKey, string | null>>;
}

export default function SiteContentForm({ initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<FieldKey, string>>(() => {
    const v = {} as Record<FieldKey, string>;
    (Object.keys(DEFAULTS) as FieldKey[]).forEach((key) => {
      v[key] = initial[key] ?? "";
    });
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: FieldKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const body: Record<string, string | null> = {};
    (Object.keys(DEFAULTS) as FieldKey[]).forEach((key) => {
      body[key] = values[key].trim() === "" ? null : values[key];
    });

    const res = await fetch("/api/admin/settings/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Type size={18} className="text-sky-500" />
          ชื่อแอปและคำโปรย
        </div>
        <p className="mt-1 text-xs text-gray-400">เว้นว่างช่องไหนไว้ ระบบจะใช้ข้อความเริ่มต้น (ที่โชว์เป็น placeholder) แทน</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">ชื่อแอป</label>
            <input className={inputCls} placeholder={DEFAULTS.appName} value={values.appName} onChange={(e) => update("appName", e.target.value)} />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-xs text-gray-500">คำโปรย (ไทย)</label>
            <input className={inputCls} placeholder={DEFAULTS.taglineTh} value={values.taglineTh} onChange={(e) => update("taglineTh", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">คำโปรย (English)</label>
            <input className={inputCls} placeholder={DEFAULTS.taglineEn} value={values.taglineEn} onChange={(e) => update("taglineEn", e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <MessageCircleHeart size={18} className="text-pink-500" />
          คำทักทายบนหน้าแรก
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {(["Morning", "Afternoon", "Evening"] as const).map((period) => (
            <Fragment key={period}>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  {period === "Morning" ? "ตอนเช้า" : period === "Afternoon" ? "ตอนบ่าย" : "ตอนเย็น"} (ไทย)
                </label>
                <input
                  className={inputCls}
                  placeholder={DEFAULTS[`greeting${period}Th`]}
                  value={values[`greeting${period}Th`]}
                  onChange={(e) => update(`greeting${period}Th`, e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">{period} (English)</label>
                <input
                  className={inputCls}
                  placeholder={DEFAULTS[`greeting${period}En`]}
                  value={values[`greeting${period}En`]}
                  onChange={(e) => update(`greeting${period}En`, e.target.value)}
                />
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ListTree size={18} className="text-violet-500" />
          ป้ายชื่อเมนูด้านล่าง
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">หน้าหลัก (ไทย)</label>
            <input className={inputCls} placeholder={DEFAULTS.navHomeTh} value={values.navHomeTh} onChange={(e) => update("navHomeTh", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Home (English)</label>
            <input className={inputCls} placeholder={DEFAULTS.navHomeEn} value={values.navHomeEn} onChange={(e) => update("navHomeEn", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">แลกรางวัล (ไทย)</label>
            <input
              className={inputCls}
              placeholder={DEFAULTS.navRedeemTh}
              value={values.navRedeemTh}
              onChange={(e) => update("navRedeemTh", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Redeem Rewards (English)</label>
            <input
              className={inputCls}
              placeholder={DEFAULTS.navRedeemEn}
              value={values.navRedeemEn}
              onChange={(e) => update("navRedeemEn", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "กำลังบันทึก..." : "บันทึกข้อความ"}
        </button>
        {saved && !saving && <span className="text-xs text-brand-600">บันทึกแล้ว</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </form>
  );
}
