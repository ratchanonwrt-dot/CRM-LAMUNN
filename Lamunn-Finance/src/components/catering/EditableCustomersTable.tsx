"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";
import { formatBaht, customerSourceLabel } from "@/lib/format";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  source: string | null;
  bookingCount: number;
  totalAmount: number;
}

export default function EditableCustomersTable({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [nameDraft, setNameDraft] = useState<Record<string, string>>(Object.fromEntries(customers.map((c) => [c.id, c.name])));
  const [phoneDraft, setPhoneDraft] = useState<Record<string, string>>(Object.fromEntries(customers.map((c) => [c.id, c.phone])));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function save(id: string, field: "name" | "phone", value: string, original: string) {
    if (!canEdit || value === original) return;
    setBusyId(id);
    setErrorId(null);
    const res = await fetch(`/api/catering/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorId(id);
      setErrorMsg(data.error ?? "บันทึกไม่สำเร็จ");
      // ค่าที่กรอกผิดพลาด — เด้งกลับเป็นค่าเดิมให้เห็นชัดว่าไม่ได้ถูกบันทึก
      if (field === "name") setNameDraft((d) => ({ ...d, [id]: original }));
      else setPhoneDraft((d) => ({ ...d, [id]: original }));
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[700px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2">ชื่อ</th>
            <th className="px-4 py-2">เบอร์โทร</th>
            <th className="px-4 py-2">มาจากไหน</th>
            <th className="px-4 py-2">จำนวนครั้งที่จอง</th>
            <th className="px-4 py-2">ยอดรวมสะสม</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const busy = busyId === c.id;
            const hasError = errorId === c.id;
            return (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {canEdit ? (
                    <input
                      value={nameDraft[c.id] ?? ""}
                      disabled={busy}
                      onChange={(e) => setNameDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                      onBlur={(e) => save(c.id, "name", e.target.value.trim(), c.name)}
                      className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 outline-none hover:border-gray-200 hover:bg-gray-50 focus:border-brand-400 focus:bg-white disabled:opacity-50"
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {canEdit ? (
                    <div>
                      <input
                        value={phoneDraft[c.id] ?? ""}
                        disabled={busy}
                        onChange={(e) => setPhoneDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                        onBlur={(e) => save(c.id, "phone", e.target.value.trim(), c.phone)}
                        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 outline-none hover:border-gray-200 hover:bg-gray-50 focus:border-brand-400 focus:bg-white disabled:opacity-50"
                      />
                      {hasError && <p className="px-2 text-[11px] text-red-500">{errorMsg}</p>}
                    </div>
                  ) : (
                    c.phone
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">{c.source ? customerSourceLabel[c.source] ?? c.source : "-"}</td>
                <td className="px-4 py-2 text-gray-700">{c.bookingCount}</td>
                <td className="px-4 py-2 text-gray-700">{formatBaht(c.totalAmount)} บาท</td>
              </tr>
            );
          })}
          {customers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                ยังไม่มีข้อมูลลูกค้า
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
