"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ToggleActiveButton from "@/components/ToggleActiveButton";

interface BranchOption {
  id: string;
  code: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "BRANCH_MANAGER" | "STAFF";
  branchId: string | null;
  branch: { code: string; name: string } | null;
  isActive: boolean;
}

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบ",
  BRANCH_MANAGER: "ผู้จัดการสาขา",
  STAFF: "พนักงาน",
};

export default function StaffRow({
  staff,
  branches,
  canChooseRole,
}: {
  staff: Staff;
  branches: BranchOption[];
  canChooseRole: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(staff.role);
  const [branchId, setBranchId] = useState(staff.branchId ?? branches[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password: password || undefined,
        role,
        branchId: role === "SUPER_ADMIN" ? undefined : branchId,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setEditing(false);
    setPassword("");
    router.refresh();
  }

  return (
    <>
      <tr className="border-t border-gray-100">
        <td className="px-4 py-2">{staff.name}</td>
        <td className="px-4 py-2 text-gray-500">{staff.email}</td>
        <td className="px-4 py-2">{roleLabel[staff.role]}</td>
        <td className="px-4 py-2 text-gray-500">{staff.branch ? `${staff.branch.code} — ${staff.branch.name}` : "ทุกสาขา"}</td>
        <td className="px-4 py-2">
          <ToggleActiveButton endpoint={`/api/admin/staff/${staff.id}`} isActive={staff.isActive} />
        </td>
        <td className="px-4 py-2">
          <button onClick={() => setEditing((v) => !v)} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {editing ? "ยกเลิก" : "แก้ไข"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr className="border-t border-gray-100 bg-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <input required placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <input required type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <input type="password" minLength={8} placeholder="รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              {canChooseRole ? (
                <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="STAFF">พนักงาน</option>
                  <option value="BRANCH_MANAGER">ผู้จัดการสาขา</option>
                  <option value="SUPER_ADMIN">ผู้ดูแลระบบ</option>
                </select>
              ) : (
                <input disabled value={roleLabel[role]} className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500" />
              )}
              {role !== "SUPER_ADMIN" && (
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
