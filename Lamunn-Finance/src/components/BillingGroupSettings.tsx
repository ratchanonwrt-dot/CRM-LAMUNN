"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

interface BillingGroupRow {
  id: string;
  name: string;
  usesSummarySheet: boolean;
  usesPaymentReceipt: boolean;
  usesTaxInvoice: boolean;
  usesWithholdingCert: boolean;
}

const FIELDS = [
  { key: "usesSummarySheet", label: "ใบสรุปยอด" },
  { key: "usesPaymentReceipt", label: "ใบรับเงิน" },
  { key: "usesTaxInvoice", label: "ใบเสร็จ/ใบกำกับภาษี" },
  { key: "usesWithholdingCert", label: "ใบหัก ณ ที่จ่าย" },
] as const;

function Toggle({ groupId, field, checked }: { groupId: string; field: string; checked: boolean }) {
  const router = useRouter();
  const canEdit = useCanEdit("CREDIT_TERM");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!canEdit || loading) return;
    setLoading(true);
    await fetch(`/api/billing-groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !checked }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={!canEdit || loading}
      onClick={toggle}
      className={`h-5 w-5 rounded border text-xs font-bold disabled:cursor-not-allowed ${
        checked ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white text-transparent"
      }`}
    >
      ✓
    </button>
  );
}

function AddGroupForm({ onAdded }: { onAdded: () => void }) {
  const canEdit = useCanEdit("CREDIT_TERM");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canEdit) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/billing-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    setName("");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="ชื่อประเภทวางบิลใหม่ เช่น Big C"
        className="w-64 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
      />
      <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "กำลังเพิ่ม..." : "+ เพิ่มประเภท"}
      </button>
    </form>
  );
}

export default function BillingGroupSettings({ groups }: { groups: BillingGroupRow[] }) {
  const router = useRouter();
  return (
    <div>
      <AddGroupForm onAdded={() => router.refresh()} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">ประเภทวางบิล</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="px-3 py-2 text-center">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-800">{g.name}</td>
                {FIELDS.map((f) => (
                  <td key={f.key} className="px-3 py-2 text-center">
                    <div className="flex justify-center">
                      <Toggle groupId={g.id} field={f.key} checked={g[f.key]} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                  ยังไม่มีประเภทวางบิล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
