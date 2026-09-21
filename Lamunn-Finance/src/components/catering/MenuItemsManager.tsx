"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCanEdit } from "@/lib/RoleContext";

export interface MenuItem {
  id: string;
  category: "MENU" | "SERVICE" | "SNACK_BOX";
  name: string;
  unitLabel: string | null;
  unitPrice: number | null;
  minPrice: number | null;
  isActive: boolean;
  sortOrder: number;
}

const CATEGORY_LABEL: Record<MenuItem["category"], string> = {
  MENU: "รายการเมนู",
  SERVICE: "ค่าบริการ",
  SNACK_BOX: "Snack Box",
};

function ItemRow({ item }: { item: MenuItem }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [name, setName] = useState(item.name);
  const [unitLabel, setUnitLabel] = useState(item.unitLabel ?? "");
  const [unitPrice, setUnitPrice] = useState(item.unitPrice != null ? String(item.unitPrice) : "");
  const [minPrice, setMinPrice] = useState(item.minPrice != null ? String(item.minPrice) : "");
  const [saving, setSaving] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/catering/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`ลบ "${item.name}" ออกจากเมนูใช่ไหม?`)) return;
    await fetch(`/api/catering/menu-items/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
      <input
        disabled={!canEdit}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== item.name && save({ name })}
        className="w-48 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <input
        disabled={!canEdit}
        value={unitLabel}
        onChange={(e) => setUnitLabel(e.target.value)}
        onBlur={() => unitLabel !== (item.unitLabel ?? "") && save({ unitLabel })}
        placeholder="หน่วย เช่น ต่อ 1 เสิร์ฟ"
        className="w-40 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          min="0"
          disabled={!canEdit}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          onBlur={() => {
            const prev = item.unitPrice != null ? String(item.unitPrice) : "";
            if (unitPrice !== prev) save({ unitPrice: unitPrice || null });
          }}
          placeholder="ราคา"
          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="text-xs text-gray-400">บาท</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          min="0"
          disabled={!canEdit}
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={() => {
            const prev = item.minPrice != null ? String(item.minPrice) : "";
            if (minPrice !== prev) save({ minPrice: minPrice || null });
          }}
          placeholder="ไม่บังคับ"
          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="text-xs text-gray-400">ขั้นต่ำ</span>
      </div>
      <label className="flex items-center gap-1.5 text-xs text-gray-500">
        <input
          type="checkbox"
          disabled={!canEdit}
          checked={item.isActive}
          onChange={(e) => save({ isActive: e.target.checked })}
        />
        ใช้งาน
      </label>
      {canEdit && (
        <button type="button" onClick={handleDelete} className="ml-auto text-xs text-red-500 hover:underline">
          ลบ
        </button>
      )}
      {saving && <span className="text-xs text-amber-500">กำลังบันทึก...</span>}
    </div>
  );
}

function AddItemForm({ category }: { category: MenuItem["category"] }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [name, setName] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [saving, setSaving] = useState(false);

  if (!canEdit) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    await fetch("/api/catering/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, name, unitLabel: unitLabel || undefined, unitPrice: unitPrice || undefined, minPrice: minPrice || undefined }),
    });
    setSaving(false);
    setName("");
    setUnitLabel("");
    setUnitPrice("");
    setMinPrice("");
    router.refresh();
  }

  return (
    <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ชื่อรายการ</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">หน่วย (ถ้ามี)</label>
        <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="เช่น ต่อ 150 เสิร์ฟ" className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ราคา (บาท, เว้นว่างได้)</label>
        <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">ราคาขั้นต่ำ (ถ้าจะให้แก้เองได้แต่ห้ามต่ำกว่านี้)</label>
        <input type="number" step="0.01" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white" />
      </div>
      <button type="submit" disabled={saving || !name} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        + เพิ่มรายการ
      </button>
    </form>
  );
}

export default function MenuItemsManager({ items }: { items: MenuItem[] }) {
  const byCategory: Record<MenuItem["category"], MenuItem[]> = { MENU: [], SERVICE: [], SNACK_BOX: [] };
  for (const item of items) byCategory[item.category].push(item);

  return (
    <div className="flex flex-col gap-6">
      {(["MENU", "SERVICE", "SNACK_BOX"] as const).map((category) => (
        <div key={category} className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">{CATEGORY_LABEL[category]}</h2>
          {category === "SNACK_BOX" && (
            <p className="mb-3 text-xs text-gray-400">
              ปกติ Snack Box ราคา/รายการไม่ตายตัว — เพิ่มไว้เป็นตัวเลือกได้ถ้าต้องการ แต่ส่วนใหญ่พนักงานจะเขียนรายการและราคาเองสดๆ หน้างานตอนเพิ่มรายการในแต่ละงานได้อยู่แล้ว (ช่อง &quot;รายการอิสระ&quot; ในหน้างานจัดเลี้ยง)
            </p>
          )}
          <div className="mb-4 flex flex-col gap-2">
            {byCategory[category].map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
            {byCategory[category].length === 0 && <p className="text-sm text-gray-400">ยังไม่มีรายการในหมวดนี้</p>}
          </div>
          <AddItemForm category={category} />
        </div>
      ))}
    </div>
  );
}
