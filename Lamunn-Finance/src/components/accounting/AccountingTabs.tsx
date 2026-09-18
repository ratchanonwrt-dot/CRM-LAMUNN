"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/accounting", label: "ภาพรวมบัญชี", exact: true },
  { href: "/accounting/trial-balance", label: "งบทดลอง" },
  { href: "/accounting/income-statement", label: "งบกำไรขาดทุน" },
  { href: "/accounting/balance-sheet", label: "งบแสดงฐานะการเงิน" },
  { href: "/accounting/journal", label: "สมุดรายวัน" },
  { href: "/accounting/ledger", label: "บัญชีแยกประเภท" },
  { href: "/accounting/daily-posting", label: "ลงบัญชียอดขายรายวัน" },
  { href: "/accounting/tax-invoices", label: "ใบกำกับภาษีเต็มรูป" },
  { href: "/accounting/tax-reports", label: "รายงานภาษี" },
  { href: "/accounting/accounts", label: "ผังบัญชี" },
  { href: "/accounting/live-payouts", label: "ทำจ่ายคนไลฟ์" },
];

export default function AccountingTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-5 flex flex-wrap gap-1.5 border-b border-gray-200 pb-3">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
