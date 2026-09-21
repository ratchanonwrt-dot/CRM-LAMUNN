"use client";

import { useEffect, useMemo, useState } from "react";
import { useServerRefresh } from "./useServerRefresh";
import { Search, X } from "lucide-react";

export interface AccountListItem {
  id: string;
  code: string;
  nameTh: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentCode: string | null;
  isPostable: boolean;
  isActive: boolean;
  vatRole: "OUTPUT" | "INPUT" | "WHT" | null;
  usedCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  ASSET: "1 สินทรัพย์",
  LIABILITY: "2 หนี้สิน",
  EQUITY: "3 ส่วนของผู้ถือหุ้น",
  REVENUE: "4 รายได้",
  EXPENSE: "5 ต้นทุนและค่าใช้จ่าย",
};
const TYPE_ORDER: AccountListItem["type"][] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

const VAT_LABELS: Record<string, string> = {
  OUTPUT: "ภาษีขาย",
  INPUT: "ภาษีซื้อ",
  WHT: "หัก ณ ที่จ่าย",
};

/** ผังบัญชีพร้อมช่องค้นหาและแก้ไขในแถว — ค้นได้ทั้งรหัสและชื่อบัญชี
 *
 * แก้/ปิดใช้/ลบ แล้วแถวเปลี่ยนบนจอทันทีที่ API ตอบ (แก้สำเนาในหน่วยความจำก่อน)
 * ส่วน router.refresh() วิ่งเบื้องหลังเพื่อ sync ข้อมูลจากเซิร์ฟเวอร์ตามมา — ไม่ต้องรอหน้าโหลดซ้ำ */
export default function AccountList({
  accounts,
  groups,
  canEdit,
}: {
  accounts: AccountListItem[];
  groups: { code: string; nameTh: string }[];
  canEdit: boolean;
}) {
  const [items, setItems] = useState(accounts);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(accounts);
  }, [accounts]);

  const patch = (id: string, changes: Partial<AccountListItem>) =>
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  const remove = (id: string) => setItems((prev) => prev.filter((a) => a.id !== id));

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter((a) => a.code.toLowerCase().includes(q) || a.nameTh.toLowerCase().includes(q));
  }, [items, q]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-96">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารหัสบัญชี หรือชื่อบัญชี"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-9 text-sm text-gray-900"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ล้างคำค้น"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {q ? `พบ ${filtered.length} จาก ${items.length} บัญชี` : `ทั้งหมด ${items.length} บัญชี`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
          ไม่พบบัญชีที่ตรงกับ &ldquo;{query}&rdquo;
        </div>
      ) : (
        <div className="space-y-5">
          {TYPE_ORDER.filter((t) => filtered.some((a) => a.type === t)).map((type) => (
            <div key={type} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-800">{TYPE_LABELS[type]}</p>
                <span className="text-xs text-gray-400">{filtered.filter((a) => a.type === type).length} บัญชี</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {filtered
                    .filter((a) => a.type === type)
                    .map((a) =>
                      editingId === a.id ? (
                        <tr key={a.id} className="border-b border-gray-100 bg-brand-50/40">
                          <td colSpan={5} className="p-4">
                            <AccountEditForm
                              account={a}
                              groups={groups}
                              onSaved={(changes) => {
                                patch(a.id, changes);
                                setEditingId(null);
                              }}
                              onCancel={() => setEditingId(null)}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr key={a.id} className={`border-b border-gray-50 ${!a.isActive ? "opacity-40" : ""}`}>
                          <td className="w-24 py-2 pl-4 font-mono text-xs text-gray-500">
                            <Highlight text={a.code} query={q} />
                          </td>
                          <td className={`py-2 ${a.isPostable ? "text-gray-800" : "font-semibold text-gray-900"}`}>
                            <Highlight text={a.nameTh} query={q} />
                            {!a.isPostable && <span className="ml-2 text-xs font-normal text-gray-400">(หัวข้อรวม — ลงรายการไม่ได้)</span>}
                            {!a.isActive && <span className="ml-2 text-xs font-normal text-gray-400">(ปิดใช้งาน)</span>}
                          </td>
                          <td className="py-2 text-right text-xs text-gray-400">{a.vatRole ? VAT_LABELS[a.vatRole] : ""}</td>
                          <td className="w-28 py-2 text-right text-xs text-gray-400">{a.usedCount ? `${a.usedCount} รายการ` : ""}</td>
                          <td className="w-32 py-2 pr-4 text-right">
                            {canEdit && (
                              <RowActions
                                account={a}
                                onEdit={() => setEditingId(a.id)}
                                onToggled={(isActive) => patch(a.id, { isActive })}
                                onRemoved={() => remove(a.id)}
                              />
                            )}
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-amber-200 px-0.5">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function RowActions({
  account,
  onEdit,
  onToggled,
  onRemoved,
}: {
  account: AccountListItem;
  onEdit: () => void;
  onToggled: (isActive: boolean) => void;
  onRemoved: () => void;
}) {
  const { refresh } = useServerRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    const next = !account.isActive;
    const res = await fetch(`/api/accounting/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    onToggled(next);
    refresh();
  }

  async function remove() {
    if (!confirm(`ลบบัญชี ${account.code} ${account.nameTh} ทิ้ง?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/accounting/accounts/${account.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    onRemoved();
    refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-rose-600">{error}</span>}
      <button type="button" onClick={onEdit} className="text-xs text-brand-700 hover:underline">
        แก้ไข
      </button>
      <button type="button" disabled={busy} onClick={toggleActive} className="text-xs text-gray-500 hover:underline disabled:opacity-50">
        {account.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      </button>
      <button type="button" disabled={busy} onClick={remove} className="text-xs text-rose-500 hover:underline disabled:opacity-50">
        ลบ
      </button>
    </div>
  );
}

function AccountEditForm({
  account,
  groups,
  onSaved,
  onCancel,
}: {
  account: AccountListItem;
  groups: { code: string; nameTh: string }[];
  onSaved: (changes: Partial<AccountListItem>) => void;
  onCancel: () => void;
}) {
  const { refresh } = useServerRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: account.code,
    nameTh: account.nameTh,
    parentCode: account.parentCode ?? "",
    isPostable: account.isPostable,
    vatRole: account.vatRole ?? "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/accounting/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    // แสดงค่าที่กรอกทันที — เซิร์ฟเวอร์จะ sync ค่าจริง (เช่นบัญชีลูกที่ย้ายตามรหัสใหม่) ตามมา
    onSaved({
      code: form.code.trim(),
      nameTh: form.nameTh.trim(),
      parentCode: form.parentCode || null,
      isPostable: form.isPostable,
      vatRole: (form.vatRole || null) as AccountListItem["vatRole"],
    });
    refresh();
  }

  const field = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900";
  const label = "text-xs text-gray-500";

  return (
    <form onSubmit={save}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={label}>
          รหัสบัญชี
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={`${field} font-mono`} />
        </label>
        <label className={`${label} lg:col-span-2`}>
          ชื่อบัญชี
          <input required value={form.nameTh} onChange={(e) => setForm({ ...form, nameTh: e.target.value })} className={field} />
        </label>
        <label className={label}>
          อยู่ในกลุ่มของงบ
          <select value={form.parentCode} onChange={(e) => setForm({ ...form, parentCode: e.target.value })} className={field}>
            <option value="">— จัดตามหมวดอัตโนมัติ —</option>
            {groups.map((g) => (
              <option key={g.code} value={g.code}>
                {g.code} {g.nameTh}
              </option>
            ))}
          </select>
        </label>
        <label className={`${label} lg:col-span-2`}>
          บทบาททางภาษี
          <select value={form.vatRole} onChange={(e) => setForm({ ...form, vatRole: e.target.value })} className={field}>
            <option value="">— ไม่ใช่บัญชีภาษี —</option>
            <option value="OUTPUT">ภาษีขาย</option>
            <option value="INPUT">ภาษีซื้อ</option>
            <option value="WHT">ภาษีหัก ณ ที่จ่าย</option>
          </select>
          <span className="mt-1 block text-xs text-gray-400">
            ตั้งไว้ให้ถูก รายการที่ลงบัญชีนี้จึงจะถูกดึงเข้ารายงานภาษีซื้อ/ภาษีขาย และ ภ.พ.30 อัตโนมัติ
          </span>
        </label>
      </div>

      <label className="mt-3 flex items-start gap-2.5 rounded-lg bg-gray-50 p-3">
        <input
          type="checkbox"
          checked={!form.isPostable}
          onChange={(e) => setForm({ ...form, isPostable: !e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">
          เป็นบัญชีหัวข้อรวม (ลงรายการตรง ๆ ไม่ได้)
          <span className="mt-0.5 block text-xs text-gray-500">ติ๊กไว้สำหรับบัญชีที่ใช้จัดกลุ่มในงบเท่านั้น เช่น &ldquo;สินทรัพย์หมุนเวียน&rdquo;</span>
        </span>
      </label>

      {account.usedCount > 0 && form.code !== account.code && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          บัญชีนี้ถูกใช้ในสมุดรายวันแล้ว {account.usedCount} รายการ — เปลี่ยนรหัสได้ ใบสำคัญเดิมยังผูกอยู่กับบัญชีเดียวกัน
          (ผูกด้วย id ไม่ใช่รหัส) และบัญชีลูกที่อยู่ในกลุ่มนี้จะถูกย้ายตามรหัสใหม่ให้อัตโนมัติ
        </p>
      )}

      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {busy ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
