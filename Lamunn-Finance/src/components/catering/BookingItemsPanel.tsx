"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBaht } from "@/lib/format";
import { useCanEdit } from "@/lib/RoleContext";

const VAT_RATE = 0.07;

interface BookingItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface MenuItem {
  id: string;
  name: string;
  unitLabel: string | null;
  unitPrice: number | null;
  minPrice: number | null;
}

// แถวรายการที่เพิ่มไว้แล้ว — แก้ไขได้ทุกช่อง (ไม่ใช่แค่ลบ) บันทึกอัตโนมัติตอนออกจากช่อง
function ItemRow({ bookingId, item }: { bookingId: string; item: BookingItem }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [description, setDescription] = useState(item.description);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unitPrice, setUnitPrice] = useState(String(item.unitPrice));
  const [saving, setSaving] = useState(false);

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/catering/bookings/${bookingId}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    router.refresh();
  }

  async function handleRemove() {
    await fetch(`/api/catering/bookings/${bookingId}/items/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
      <input
        disabled={!canEdit}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== item.description && save({ description })}
        className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <input
          type="number"
          step="0.01"
          min="0"
          disabled={!canEdit}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => Number(quantity) !== item.quantity && save({ quantity })}
          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span>x</span>
        <input
          type="number"
          step="0.01"
          min="0"
          disabled={!canEdit}
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          onBlur={() => Number(unitPrice) !== item.unitPrice && save({ unitPrice })}
          className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      <span className="w-24 text-right font-medium text-gray-800">{formatBaht(item.quantity * item.unitPrice)}</span>
      {canEdit && (
        <button type="button" onClick={handleRemove} className="text-xs text-red-500 hover:underline">
          ลบ
        </button>
      )}
      {saving && <span className="text-xs text-amber-500">กำลังบันทึก...</span>}
    </div>
  );
}

// ติ๊กรายการจากเมนูมาตรฐาน — ราคาแก้ได้ต่อครั้ง แต่ถ้าเมนูตั้งราคาขั้นต่ำไว้ (เช่น ค่าพนักงาน) จะแก้ให้ต่ำกว่านั้นไม่ได้
function MenuChecklist({ bookingId, menuItems }: { bookingId: string; menuItems: MenuItem[] }) {
  const router = useRouter();
  const canEdit = useCanEdit("CATERING");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (menuItems.length === 0) return null;

  function toggle(item: MenuItem) {
    setChecked((c) => ({ ...c, [item.id]: !c[item.id] }));
    if (!quantities[item.id]) setQuantities((q) => ({ ...q, [item.id]: "1" }));
    if (prices[item.id] === undefined) setPrices((p) => ({ ...p, [item.id]: item.unitPrice != null ? String(item.unitPrice) : "" }));
  }

  function priceFor(item: MenuItem): number {
    const raw = Number(prices[item.id] ?? item.unitPrice ?? 0);
    return item.minPrice != null ? Math.max(raw, item.minPrice) : raw;
  }

  async function handleAddChecked() {
    const toAdd = menuItems.filter((m) => checked[m.id]);
    if (toAdd.length === 0) return;
    setSaving(true);
    for (const m of toAdd) {
      await fetch(`/api/catering/bookings/${bookingId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: m.unitLabel ? `${m.name} (${m.unitLabel})` : m.name,
          quantity: quantities[m.id] || 1,
          unitPrice: priceFor(m),
        }),
      });
    }
    setSaving(false);
    setChecked({});
    setQuantities({});
    setPrices({});
    router.refresh();
  }

  const anyChecked = Object.values(checked).some(Boolean);

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-medium text-gray-500">ติ๊กรายการที่ใช้ในงานนี้ — แก้จำนวน/ราคาต่อครั้งได้ (แก้เมนู/ราคาเริ่มต้นถาวรที่หน้า &quot;จัดการเมนู/ราคา&quot;)</p>
      <div className="mb-3 flex flex-col gap-1.5">
        {menuItems.map((m) => {
          const isChecked = !!checked[m.id];
          const currentPrice = prices[m.id] ?? (m.unitPrice != null ? String(m.unitPrice) : "");
          const belowMin = isChecked && m.minPrice != null && Number(currentPrice) < m.minPrice;
          return (
            <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <label className="flex flex-1 items-center gap-2">
                <input type="checkbox" disabled={!canEdit} checked={isChecked} onChange={() => toggle(m)} />
                <span className="text-gray-800">
                  {m.name}
                  {m.unitLabel && <span className="text-gray-400"> ({m.unitLabel})</span>}
                </span>
              </label>
              {isChecked && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">จำนวน</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!canEdit}
                      value={quantities[m.id] ?? "1"}
                      onChange={(e) => setQuantities((q) => ({ ...q, [m.id]: e.target.value }))}
                      className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">ราคา/หน่วย</span>
                    <input
                      type="number"
                      step="0.01"
                      min={m.minPrice ?? 0}
                      disabled={!canEdit}
                      value={currentPrice}
                      onChange={(e) => setPrices((p) => ({ ...p, [m.id]: e.target.value }))}
                      onBlur={() => {
                        if (m.minPrice != null && Number(currentPrice) < m.minPrice) {
                          setPrices((p) => ({ ...p, [m.id]: String(m.minPrice) }));
                        }
                      }}
                      className={`w-24 rounded-lg border px-2 py-1 text-right text-sm outline-none focus:border-brand-400 ${belowMin ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
                    />
                  </div>
                </>
              )}
              {!isChecked && (
                <span className="text-gray-500">{m.unitPrice != null ? `${formatBaht(m.unitPrice)} บาท` : "ราคากรอกเอง"}</span>
              )}
              {belowMin && <span className="text-xs text-red-600">ต่ำกว่าขั้นต่ำ {formatBaht(m.minPrice!)} บาท — จะปรับเป็นขั้นต่ำให้อัตโนมัติ</span>}
            </div>
          );
        })}
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={handleAddChecked}
          disabled={!anyChecked || saving}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "กำลังเพิ่ม..." : "+ เพิ่มรายการที่ติ๊กไว้"}
        </button>
      )}
    </div>
  );
}

export default function BookingItemsPanel({
  bookingId,
  items,
  menuItems = [],
  minimumOrder,
}: {
  bookingId: string;
  items: BookingItem[];
  menuItems?: MenuItem[];
  minimumOrder: number;
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !unitPrice) return;
    setSaving(true);
    await fetch(`/api/catering/bookings/${bookingId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, quantity, unitPrice }),
    });
    setSaving(false);
    setDescription("");
    setQuantity("1");
    setUnitPrice("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">รายการ (custom ต่องานนี้)</h2>

      <div className="mb-4 flex flex-col gap-2">
        {items.map((item) => (
          <ItemRow key={item.id} bookingId={bookingId} item={item} />
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">ยังไม่มีรายการ — ยอดรวมใช้จากช่อง &quot;ยอดรวม&quot; ด้านบน</p>}
      </div>

      {items.length > 0 && (
        <div className="mb-4 flex flex-col gap-1 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span>รวมจากรายการ (ก่อน VAT)</span>
            <span>{formatBaht(subtotal)} บาท</span>
          </div>
          <div className="flex items-center justify-between text-gray-500">
            <span>VAT 7%</span>
            <span>{formatBaht(vat)} บาท</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-1 text-base font-bold text-brand-700">
            <span>ยอดสุดท้าย (รวม VAT)</span>
            <span>{formatBaht(grandTotal)} บาท</span>
          </div>
          {subtotal < minimumOrder && (
            <p className="mt-1 text-xs text-amber-700">ยอดก่อน VAT ต่ำกว่าขั้นต่ำ {formatBaht(minimumOrder)} บาท</p>
          )}
        </div>
      )}

      <MenuChecklist bookingId={bookingId} menuItems={menuItems} />

      <p className="mb-2 text-xs font-medium text-gray-500">รายการอิสระ (เช่น Snack Box — เขียนเองหน้างานได้เลย)</p>
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">รายการ</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">จำนวน</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">ราคาต่อหน่วย</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !description || !unitPrice}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          + เพิ่มรายการ
        </button>
      </form>
    </div>
  );
}
