"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExistingRow {
  tiktok: number;
  fbLine: number;
  pickup: number;
  catering: number;
  depositGrab: number | null;
  depositLineman: number | null;
  depositStorefront: number | null;
  depositEcom: number | null;
  note: string | null;
}

export default function CompanyChannelForm({ date, existing }: { date: string; existing: ExistingRow | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    tiktok: existing?.tiktok?.toString() ?? "",
    fbLine: existing?.fbLine?.toString() ?? "",
    pickup: existing?.pickup?.toString() ?? "",
    catering: existing?.catering?.toString() ?? "",
    depositGrab: existing?.depositGrab?.toString() ?? "",
    depositLineman: existing?.depositLineman?.toString() ?? "",
    depositStorefront: existing?.depositStorefront?.toString() ?? "",
    depositEcom: existing?.depositEcom?.toString() ?? "",
    note: existing?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field(key: keyof typeof form, label: string) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
        <input
          type={key === "note" ? "text" : "number"}
          step="0.01"
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-400 focus:bg-white"
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/company-channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ...form }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const ecomTotal =
    (Number(form.tiktok) || 0) + (Number(form.fbLine) || 0) + (Number(form.pickup) || 0) + (Number(form.catering) || 0);

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">E-Commerce กลาง (ไม่แยกรายสาขา)</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {field("tiktok", "TikTok")}
        {field("fbLine", "FB / Line")}
        {field("pickup", "รับหน้าร้าน")}
        {field("catering", "Catering")}
      </div>

      <h2 className="mb-4 mt-6 text-sm font-semibold text-gray-700">ยอดเข้าบัญชี (เช็คยอด, ไม่บังคับ)</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {field("depositGrab", "ยอดเข้าบัญชี Grab")}
        {field("depositLineman", "ยอดเข้าบัญชี Lineman")}
        {field("depositStorefront", "ยอดเข้าบัญชีหน้าร้าน")}
        {field("depositEcom", "ยอดเข้าบัญชี E-Com")}
      </div>

      <div className="mt-6">{field("note", "หมายเหตุ")}</div>

      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">รวม E-Commerce วันนี้: </span>
        <span className="font-bold text-brand-700">{ecomTotal.toLocaleString("th-TH")}</span>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="mt-3 text-sm text-emerald-600">บันทึกแล้ว</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
