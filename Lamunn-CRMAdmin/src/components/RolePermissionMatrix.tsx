"use client";

import { useState } from "react";
import clsx from "clsx";

export default function RolePermissionMatrix({
  features,
  roles,
  matrix,
}: {
  features: { key: string; label: string }[];
  roles: { key: string; label: string; locked?: boolean }[];
  matrix: Record<string, Record<string, boolean>>;
}) {
  const [state, setState] = useState(matrix);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(role: string, feature: string) {
    const cellKey = `${role}:${feature}`;
    const next = !state[role][feature];
    setPending(cellKey);
    setState((prev) => ({ ...prev, [role]: { ...prev[role], [feature]: next } }));

    const res = await fetch("/api/admin/role-permissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, feature, allowed: next }),
    });
    setPending(null);
    if (!res.ok) {
      // revert on failure
      setState((prev) => ({ ...prev, [role]: { ...prev[role], [feature]: !next } }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-4 py-2">เมนู</th>
            {roles.map((r) => (
              <th key={r.key} className="px-4 py-2 text-center">
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr key={f.key} className="border-t border-gray-100">
              <td className="px-4 py-2.5 font-medium text-gray-700">{f.label}</td>
              {roles.map((r) => {
                const cellKey = `${r.key}:${f.key}`;
                const allowed = r.locked ? true : (state[r.key]?.[f.key] ?? false);
                return (
                  <td key={r.key} className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => !r.locked && toggle(r.key, f.key)}
                      disabled={r.locked || pending === cellKey}
                      aria-label={`${r.label} - ${f.label}`}
                      title={r.locked ? "ผู้จัดการเข้าได้ทุกเมนูเสมอ แก้ไม่ได้" : undefined}
                      className={clsx(
                        "h-5 w-9 rounded-full transition-colors disabled:cursor-not-allowed",
                        allowed ? "bg-brand-600" : "bg-gray-200",
                        r.locked ? "opacity-60" : "disabled:opacity-50"
                      )}
                    >
                      <span
                        className={clsx(
                          "block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow transition-transform",
                          allowed && "translate-x-4"
                        )}
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
