"use client";

import { useState } from "react";

type Role = "MANAGER" | "STAFF" | "CATERING_STAFF";
type Section =
  | "DASHBOARD"
  | "REPORTS"
  | "MONTHLY"
  | "CREDIT_TERM"
  | "RENT"
  | "CASH_STATUS"
  | "DEPOSITS"
  | "HELD_DEPOSITS"
  | "EVENTS"
  | "BRANCHES"
  | "RECONCILIATION"
  | "SETTINGS"
  | "CATERING"
  | "ACCOUNTING"
  | "INVESTMENT_COST";

interface PermissionRow {
  role: string;
  section: string;
  canView: boolean;
  canEdit: boolean;
}

const SECTIONS: { key: Section; label: string }[] = [
  { key: "DASHBOARD", label: "ภาพรวม" },
  { key: "REPORTS", label: "รายงาน/วิเคราะห์" },
  { key: "MONTHLY", label: "ยอดขายรายวัน (รายเดือน)" },
  { key: "CREDIT_TERM", label: "Credit Term / วางบิล" },
  { key: "RENT", label: "ค่าเช่า" },
  { key: "CASH_STATUS", label: "สถานะเงินสด" },
  { key: "DEPOSITS", label: "เงินเข้าบัญชี" },
  { key: "HELD_DEPOSITS", label: "เงินมัดจำ" },
  { key: "EVENTS", label: "Event ชั่วคราว" },
  { key: "BRANCHES", label: "ตั้งค่าสาขา/ค่าเช่า" },
  { key: "RECONCILIATION", label: "เช็คยอด POS" },
  { key: "SETTINGS", label: "ตั้งค่าระบบ" },
  { key: "CATERING", label: "Catering" },
  { key: "ACCOUNTING", label: "ระบบบัญชี (งบการเงิน)" },
  { key: "INVESTMENT_COST", label: "ค่าใช้จ่ายลงทุน (Investment Cost)" },
];

const ROLES: { key: Role; label: string }[] = [
  { key: "MANAGER", label: "Manager" },
  { key: "STAFF", label: "Accounting Team" },
  { key: "CATERING_STAFF", label: "Catering Team" },
];

function toMap(rows: PermissionRow[]) {
  const map = new Map<string, { canView: boolean; canEdit: boolean }>();
  for (const r of rows) map.set(`${r.role}_${r.section}`, { canView: r.canView, canEdit: r.canEdit });
  return map;
}

export default function PermissionsMatrix({ initialRows }: { initialRows: PermissionRow[] }) {
  const [map, setMap] = useState(toMap(initialRows));
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function update(role: Role, section: Section, next: { canView: boolean; canEdit: boolean }) {
    const key = `${role}_${section}`;
    setSavingKey(key);
    setMap((m) => new Map(m).set(key, next));
    const res = await fetch(`/api/role-permissions/${role}/${section}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavingKey(null);
    if (res.ok) {
      const body = await res.json();
      setMap((m) => new Map(m).set(key, { canView: body.row.canView, canEdit: body.row.canEdit }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">ส่วนของระบบ</th>
            <th className="px-3 py-2 text-center">ผู้ดูแลระบบสูงสุด</th>
            {ROLES.map((r) => (
              <th key={r.key} className="px-3 py-2 text-center">
                {r.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SECTIONS.map((s) => (
            <tr key={s.key} className="border-t border-gray-100">
              <td className="px-3 py-2.5 font-medium text-gray-800">{s.label}</td>
              <td className="px-3 py-2.5 text-center text-xs text-emerald-600">ดู + แก้ไข</td>
              {ROLES.map((r) => {
                const key = `${r.key}_${s.key}`;
                const perm = map.get(key) ?? { canView: false, canEdit: false };
                const saving = savingKey === key;
                return (
                  <td key={key} className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={perm.canView}
                          disabled={saving}
                          onChange={(e) => update(r.key, s.key, { canView: e.target.checked, canEdit: e.target.checked ? perm.canEdit : false })}
                          className="h-3.5 w-3.5 accent-brand-600"
                        />
                        ดู
                      </label>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={perm.canEdit}
                          disabled={saving}
                          onChange={(e) => update(r.key, s.key, { canView: true, canEdit: e.target.checked })}
                          className="h-3.5 w-3.5 accent-brand-600"
                        />
                        แก้ไข
                      </label>
                    </div>
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
