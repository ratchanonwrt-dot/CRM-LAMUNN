"use client";

import { useState } from "react";
import Link from "next/link";
import { useServerRefresh } from "./useServerRefresh";

export type EntryStatus = "DRAFT" | "POSTED" | "VOID";

/** ปุ่มจัดการใบสำคัญหนึ่งใบ
 *
 * ร่าง        — แก้ไข / ผ่านรายการ / ลบ / พิมพ์
 * ผ่านรายการ — พิมพ์ / ยกเลิกผ่านรายการ (ดึงกลับมาเป็นร่างเพื่อแก้) / ยกเลิกใบ
 * ยกเลิกแล้ว — พิมพ์ / เรียกคืน (กลับมาเป็นร่างให้ตรวจแล้วผ่านรายการใหม่ — ใช้ตอนกดยกเลิกผิดใบ)
 *
 * "ยกเลิกผ่านรายการ" ต่างจาก "ยกเลิกใบ": อันแรกใบยังใช้ได้ แค่ออกจากงบชั่วคราวระหว่างแก้
 * แล้วกดผ่านรายการใหม่ได้ ส่วนอันหลังคือปิดใบนั้นถาวร
 *
 * พอ API ตอบสำเร็จจะบอกการ์ดผ่าน onChanged ให้เปลี่ยนสถานะบนจอทันที แล้วค่อยดึงข้อมูลใหม่
 * จากเซิร์ฟเวอร์เบื้องหลัง — ผู้ใช้ไม่ต้องรอหน้าโหลดซ้ำทั้งหน้าถึงจะเห็นว่ากดติด
 */
export default function EntryActions({
  entryId,
  status,
  onChanged,
}: {
  entryId: string;
  status: EntryStatus;
  onChanged: (next: EntryStatus | "DELETED") => void;
}) {
  const { refresh } = useServerRefresh();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "post" | "unpost" | "void" | "restore" | "delete") {
    if (action === "void" && !confirm("ยกเลิกใบสำคัญนี้? ยอดจะถูกถอดออกจากงบการเงินถาวร")) return;
    if (action === "delete" && !confirm("ลบใบสำคัญร่างนี้ทิ้ง?")) return;
    if (action === "unpost" && !confirm("ยกเลิกผ่านรายการ? ใบสำคัญจะกลับเป็นร่างเพื่อให้แก้ไขได้ และยอดจะออกจากงบจนกว่าจะผ่านรายการใหม่")) {
      return;
    }
    if (action === "restore" && !confirm("เรียกคืนใบสำคัญนี้? จะกลับมาเป็นร่าง — ตรวจแล้วกดผ่านรายการอีกครั้งเพื่อให้ยอดเข้างบ")) return;

    setBusy(true);
    setError(null);
    const res = await fetch(`/api/accounting/journal/${entryId}`, {
      method: action === "delete" ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      ...(action === "delete" ? {} : { body: JSON.stringify({ action }) }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    onChanged(action === "post" ? "POSTED" : action === "unpost" || action === "restore" ? "DRAFT" : action === "void" ? "VOID" : "DELETED");
    refresh();
  }

  const printLink = (
    <Link
      href={`/print/journal/${entryId}`}
      target="_blank"
      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
    >
      พิมพ์
    </Link>
  );

  if (status === "VOID") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {error && <span className="w-full text-right text-xs text-rose-600">{error}</span>}
        <span className="text-xs text-gray-400">ยกเลิกแล้ว</span>
        {printLink}
        <button
          type="button"
          disabled={busy}
          onClick={() => run("restore")}
          className="rounded-lg border border-brand-300 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
        >
          {busy ? "กำลังทำ..." : "เรียกคืน"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {error && <span className="w-full text-right text-xs text-rose-600">{error}</span>}
      {printLink}

      {status === "DRAFT" && (
        <>
          <Link
            href={`/accounting/journal/${entryId}/edit`}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            แก้ไข
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("post")}
            className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "กำลังทำ..." : "ผ่านรายการ"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("delete")}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            ลบ
          </button>
        </>
      )}

      {status === "POSTED" && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("unpost")}
            className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {busy ? "กำลังทำ..." : "ยกเลิกผ่านรายการ"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("void")}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          >
            ยกเลิกใบ
          </button>
        </>
      )}
    </div>
  );
}
