"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BranchOption {
  id: string;
  code: string;
  name: string;
}

export default function AddStaffForm({
  branches,
  canChooseRole,
  fixedBranchId,
}: {
  branches: BranchOption[];
  canChooseRole: boolean;
  fixedBranchId?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "SUPERVISOR" | "STAFF" | "MARKETING">("STAFF");
  const [branchId, setBranchId] = useState(fixedBranchId ?? branches[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        branchId: role === "SUPER_ADMIN" || role === "MARKETING" || role === "SUPERVISOR" ? undefined : branchId,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "เพิ่มพนักงานไม่สำเร็จ");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-6">
      <input required placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <input required type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      <input required type="password" minLength={8} placeholder="รหัสผ่าน (8+ ตัว)" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      {canChooseRole ? (
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="STAFF">พนักงาน (Staff)</option>
          <option value="SUPERVISOR">ผู้ดูแลสาขา (Supervisor)</option>
          <option value="SUPER_ADMIN">ผู้จัดการ (Manager)</option>
          <option value="MARKETING">การตลาด (Marketing)</option>
        </select>
      ) : (
        <input disabled value="พนักงาน" className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500" />
      )}
      {role !== "SUPER_ADMIN" && role !== "MARKETING" && role !== "SUPERVISOR" && (
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!!fixedBranchId} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100">
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} — {b.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
        {loading ? "กำลังเพิ่ม..." : "เพิ่มพนักงาน"}
      </button>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
