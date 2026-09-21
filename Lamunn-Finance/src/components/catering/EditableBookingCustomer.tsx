"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

interface Props {
  customerId: string;
  name: string;
  phone: string;
  size?: "sm" | "lg";
}

export default function EditableBookingCustomer({ customerId, name, phone, size = "sm" }: Props) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [nameDraft, setNameDraft] = useState(name);
  const [phoneDraft, setPhoneDraft] = useState(phone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(field: "name" | "phone", value: string, original: string) {
    if (!canEdit || value === original) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/catering/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      if (field === "name") setNameDraft(original);
      else setPhoneDraft(original);
      return;
    }
    router.refresh();
  }

  const nameClass = size === "lg" ? "text-xl font-bold text-gray-800" : "font-medium text-gray-800";
  const phoneClass = size === "lg" ? "text-sm text-gray-500" : "text-xs text-gray-400";

  if (!canEdit) {
    return (
      <>
        <p className={nameClass}>{name}</p>
        <p className={phoneClass}>{phone}</p>
      </>
    );
  }

  return (
    <div>
      <input
        value={nameDraft}
        disabled={busy}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={(e) => save("name", e.target.value.trim(), name)}
        className={`w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 outline-none hover:border-gray-200 hover:bg-gray-50 focus:border-brand-400 focus:bg-white disabled:opacity-50 ${nameClass}`}
      />
      <input
        value={phoneDraft}
        disabled={busy}
        onChange={(e) => setPhoneDraft(e.target.value)}
        onBlur={(e) => save("phone", e.target.value.trim(), phone)}
        className={`w-full rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 outline-none hover:border-gray-200 hover:bg-gray-50 focus:border-brand-400 focus:bg-white disabled:opacity-50 ${phoneClass}`}
      />
      {error && <p className="px-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
