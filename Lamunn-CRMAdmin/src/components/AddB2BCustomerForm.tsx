"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";

export default function AddB2BCustomerForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/b2b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, contactName, phone, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มลูกค้าไม่สำเร็จ");
      return;
    }
    setCompanyName("");
    setContactName("");
    setPhone("");
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Briefcase size={18} className="text-stone-500" />
        เพิ่มลูกค้า B2B/Catering ใหม่
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input required placeholder="ชื่อบริษัท/ร้าน" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="ชื่อผู้ติดต่อ" value={contactName} onChange={(e) => setContactName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input placeholder="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <div>
        <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {loading ? "กำลังเพิ่ม..." : "เพิ่มลูกค้า"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
