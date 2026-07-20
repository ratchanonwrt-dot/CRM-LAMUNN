"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddBranchForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, address, phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มสาขาไม่สำเร็จ");
      return;
    }
    setCode("");
    setName("");
    setAddress("");
    setPhone("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-5">
      <input
        required
        placeholder="รหัสสาขา เช่น BKK01"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        required
        placeholder="ชื่อสาขา"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        placeholder="ที่อยู่"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        placeholder="เบอร์โทร"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "กำลังเพิ่ม..." : "เพิ่มสาขา"}
      </button>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
