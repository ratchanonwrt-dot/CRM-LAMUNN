"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import AccountCombobox from "./AccountCombobox";
import { thaiMonthLabel } from "@/lib/format";

interface AccountOption {
  id: string;
  code: string;
  nameTh: string;
}

/** ตัวกรองของหน้าบัญชีแยกประเภท — เลือกบัญชี + เลื่อนเดือน
 *
 * ไม่ใช้ MonthFilterBar ร่วมกับหน้าอื่น เพราะตัวนั้นต่อ "?year=..." เข้ากับ basePath ตรง ๆ
 * ซึ่งจะทำ URL พังเมื่อมี accountId ติดอยู่แล้ว — ที่นี่ประกอบ query string เองทั้งชุด
 * ทำให้เปลี่ยนเดือนแล้วยังอยู่ที่บัญชีเดิม และเปลี่ยนบัญชีแล้วยังอยู่เดือนเดิม
 *
 * วิ่งผ่าน useTransition เพื่อโชว์ว่ากำลังโหลด — แถบโหลดกลางของเว็บจับเฉพาะคลิกลิงก์ ไม่จับ router.push */
export default function LedgerFilterBar({
  accounts,
  accountId,
  year,
  month,
}: {
  accounts: AccountOption[];
  accountId: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(nextYear: number, nextMonth: number, nextAccountId: string) {
    const qs = new URLSearchParams({ year: String(nextYear), month: String(nextMonth) });
    if (nextAccountId) qs.set("accountId", nextAccountId);
    startTransition(() => router.push(`/accounting/ledger?${qs}`));
  }

  const prev = () => (month === 1 ? go(year - 1, 12, accountId) : go(year, month - 1, accountId));
  const next = () => (month === 12 ? go(year + 1, 1, accountId) : go(year, month + 1, accountId));

  return (
    <div aria-busy={pending} className={`mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-opacity ${pending ? "opacity-70" : ""}`}>
      <div className="w-full sm:w-96">
        <p className="mb-1 text-xs text-gray-500">เลือกบัญชี</p>
        <AccountCombobox
          accounts={accounts}
          value={accountId}
          placeholder="— พิมพ์รหัสหรือชื่อบัญชีเพื่อค้นหา —"
          onChange={(id) => go(year, month, id)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={prev} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          ← เดือนก่อน
        </button>
        <span className="min-w-[9rem] text-center text-sm font-semibold text-gray-800">{thaiMonthLabel(year, month - 1)}</span>
        <button type="button" onClick={next} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
          เดือนถัดไป →
        </button>
      </div>

      {accountId && (
        <button
          type="button"
          onClick={() => go(year, month, "")}
          className="rounded-lg px-2.5 py-2 text-sm text-gray-500 underline hover:text-gray-700"
        >
          ดูทุกบัญชี
        </button>
      )}

      {pending && (
        <span className="flex items-center gap-1.5 py-2 text-sm text-brand-700">
          <Loader2 size={14} className="animate-spin" /> กำลังโหลด...
        </span>
      )}
    </div>
  );
}
