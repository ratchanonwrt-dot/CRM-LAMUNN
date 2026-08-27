"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

type HelpLang = "th" | "en" | "my";

const LANG_LABEL: Record<HelpLang, string> = { th: "ไทย", en: "English", my: "မြန်မာ" };

const BILL_HELP: Record<HelpLang, { title: string; body: string; example: string }> = {
  th: {
    title: "เลขที่บิล POS",
    body: "หลังจากคิดเงินลูกค้าที่ POS เสร็จแล้ว ให้กรอกเลขที่บิลจากใบเสร็จตรงนี้ ก่อนกดยืนยัน",
    example: "ตัวอย่าง: เลขที่บิลบนใบเสร็จ เช่น 000123",
  },
  en: {
    title: "POS bill number",
    body: "After finishing the customer's payment at POS, type the bill number from the receipt here before confirming.",
    example: "Example: the bill number printed on the receipt, e.g. 000123",
  },
  my: {
    title: "POS ဘေလ်နံပါတ်",
    body: "ဖောက်သည်ငွေရှင်းပြီးမှ ပြေစာပေါ်ရှိ ဘေလ်နံပါတ်ကို ဤနေရာတွင် ဖြည့်ပြီး အတည်ပြုပါ။",
    example: "ဥပမာ - ပြေစာပေါ်ရှိ ဘေလ်နံပါတ် ဥပမာ 000123",
  },
};

const LANG_STORAGE_KEY = "lamunn-admin-bill-help-lang";

export default function ConfirmRedemptionButton({
  redemptionId,
  branches,
  requiresPosBillNo,
}: {
  redemptionId: string;
  /** Passed only for HQ-level roles (no branchId of their own) — they must say
   * which branch physically handed the reward out. */
  branches?: Branch[];
  /** True for free (pointsSpent=0) vouchers — a POS discount was applied, so
   * we need the bill number on record for the per-transaction fraud check. */
  requiresPosBillNo?: boolean;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches?.[0]?.id ?? "");
  const [posBillNo, setPosBillNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpLang, setHelpLang] = useState<HelpLang>("th");
  const [verifyResult, setVerifyResult] = useState<{
    hasLiveSync: boolean;
    found: boolean;
    posDiscount: number | null;
    expectedDiscount: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "th" || saved === "en" || saved === "my") setHelpLang(saved);
    } catch {}
  }, []);

  function chooseLang(lang: HelpLang) {
    setHelpLang(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {}
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/redemptions/${redemptionId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(branches ? { branchId } : {}), ...(requiresPosBillNo ? { posBillNo } : {}) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ยืนยันไม่สำเร็จ");
      return;
    }
    if (data.billVerification) {
      // Hold off on refresh — the parent page stops rendering this component
      // the moment status flips to COMPLETED, which would wipe the banner
      // before staff ever see it. Wait for them to acknowledge it instead.
      setVerifyResult(data.billVerification);
    } else {
      router.refresh();
    }
  }

  const help = BILL_HELP[helpLang];

  return (
    <div className="mt-2 flex flex-col gap-2">
      {branches && (
        <div>
          <label className="mb-1 block text-xs text-gray-500">สาขาที่ให้ลูกค้ารับรางวัล</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {requiresPosBillNo && (
        <div>
          <div className="mb-2 rounded-lg bg-amber-50 p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1 text-xs font-semibold text-amber-800">
                <Info size={13} />
                {help.title}
              </p>
              <div className="flex gap-1">
                {(Object.keys(LANG_LABEL) as HelpLang[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => chooseLang(lang)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      helpLang === lang ? "bg-amber-600 text-white" : "bg-white text-amber-700"
                    }`}
                  >
                    {LANG_LABEL[lang]}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-800">{help.body}</p>
            <p className="mt-1 text-xs text-amber-600">{help.example}</p>
          </div>
          <label className="mb-1 block text-xs text-gray-500">เลขที่บิล POS (บังคับกรอก — ใช้ตรวจสอบส่วนลดย้อนหลัง)</label>
          <input
            value={posBillNo}
            onChange={(e) => setPosBillNo(e.target.value)}
            placeholder="เช่น 000123"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      {!verifyResult && (
        <button
          onClick={handleConfirm}
          disabled={loading || (branches && !branchId) || (requiresPosBillNo && !posBillNo.trim())}
          className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "กำลังยืนยัน..." : "ยืนยันแลกรางวัล"}
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {verifyResult && (
        <>
          <BillVerificationBanner result={verifyResult} />
          <button onClick={() => router.refresh()} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            รับทราบ
          </button>
        </>
      )}
    </div>
  );
}

function BillVerificationBanner({
  result,
}: {
  result: { hasLiveSync: boolean; found: boolean; posDiscount: number | null; expectedDiscount: number };
}) {
  if (!result.hasLiveSync) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-500">
        <HelpCircle size={14} className="shrink-0" />
        ยืนยันสำเร็จ — บันทึกเลขบิลไว้แล้ว (สาขานี้ยังไม่มีข้อมูล POS สดให้เทียบตอนนี้)
      </p>
    );
  }
  if (!result.found) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        <AlertTriangle size={14} className="shrink-0" />
        ยืนยันสำเร็จ แต่ <strong>ไม่พบเลขบิลนี้ใน POS</strong> — ตรวจสอบว่ากรอกเลขถูกต้องไหม
      </p>
    );
  }
  if (result.posDiscount! > result.expectedDiscount) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
        <AlertOctagon size={14} className="shrink-0" />
        ส่วนลดในบิลนี้ ({result.posDiscount} บ.) <strong>มากกว่า</strong>ที่คูปองควรให้ ({result.expectedDiscount} บ.)
      </p>
    );
  }
  if (result.posDiscount! < result.expectedDiscount) {
    return (
      <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
        <AlertTriangle size={14} className="shrink-0" />
        ส่วนลดในบิลนี้ ({result.posDiscount} บ.) <strong>น้อยกว่า</strong>ที่คูปองควรให้ ({result.expectedDiscount} บ.)
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
      <CheckCircle2 size={14} className="shrink-0" />
      ตรวจสอบกับ POS แล้ว ส่วนลดตรงกัน ({result.posDiscount} บ.)
    </p>
  );
}
