"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { isValidThaiTaxId } from "@/lib/taxId";

type CustomerType = "INDIVIDUAL" | "COMPANY";

export default function TaxInvoiceForm({ rawQr }: { rawQr: string }) {
  const router = useRouter();
  const [customerType, setCustomerType] = useState<CustomerType>("INDIVIDUAL");
  const [fullName, setFullName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branchTag, setBranchTag] = useState("สำนักงานใหญ่");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taxIdValid = isValidThaiTaxId(taxId);
  const canSubmit = fullName.trim() && taxIdValid && address.trim() && /\S+@\S+\.\S+/.test(email) && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr: rawQr,
          customerType,
          fullName: fullName.trim(),
          taxId: taxId.replace(/\D/g, ""),
          branchTag: customerType === "COMPANY" ? branchTag.trim() : null,
          address: address.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        setSubmitting(false);
        return;
      }
      router.push(`/status/${data.id}`);
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        {(["INDIVIDUAL", "COMPANY"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setCustomerType(type)}
            className={clsx(
              "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
              customerType === type ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-300 text-gray-600"
            )}
          >
            {type === "INDIVIDUAL" ? "บุคคลธรรมดา" : "นิติบุคคล"}
          </button>
        ))}
      </div>

      <Field label={customerType === "COMPANY" ? "ชื่อบริษัท" : "ชื่อ-นามสกุล"}>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder={customerType === "COMPANY" ? "บริษัท ตัวอย่าง จำกัด" : "สมชาย ใจดี"}
        />
      </Field>

      <Field label="เลขประจำตัวผู้เสียภาษี 13 หลัก" error={taxId.length === 13 && !taxIdValid ? "เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง" : undefined}>
        <input
          value={taxId}
          onChange={(e) => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 13))}
          inputMode="numeric"
          className="input"
          placeholder="1234567890123"
        />
      </Field>

      {customerType === "COMPANY" && (
        <Field label="สำนักงานใหญ่ / สาขา">
          <input value={branchTag} onChange={(e) => setBranchTag(e.target.value)} className="input" placeholder="สำนักงานใหญ่" />
        </Field>
      )}

      <Field label="ที่อยู่สำหรับออกใบกำกับภาษี">
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-[80px]" placeholder="เลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" />
      </Field>

      <Field label="อีเมลสำหรับรับใบกำกับภาษี">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input" placeholder="you@example.com" />
      </Field>

      <Field label="เบอร์โทรศัพท์ (ถ้ามี)">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="08X-XXX-XXXX" />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-md bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "กำลังส่งคำขอ..." : "ขอใบกำกับภาษี"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: 2px solid #2aab63;
          outline-offset: 1px;
        }
      `}</style>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
