"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/accounting/tax-reports", label: "ภ.พ.30", exact: true },
  { href: "/accounting/tax-reports/output-vat", label: "รายงานภาษีขาย" },
  { href: "/accounting/tax-reports/input-vat", label: "รายงานภาษีซื้อ" },
  { href: "/accounting/tax-reports/pnd3", label: "ภ.ง.ด.3" },
  { href: "/accounting/tax-reports/pnd53", label: "ภ.ง.ด.53" },
];

/** แท็บย่อยของหมวดรายงานภาษี — พกเดือนที่เลือกอยู่ติดไปด้วย
 * (สลับจากภาษีขายไปภาษีซื้อแล้วต้องยังเป็นเดือนเดิม ไม่เด้งกลับเดือนปัจจุบัน) */
export default function TaxReportTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const year = params.get("year");
  const month = params.get("month");
  const qs = year && month ? `?year=${year}&month=${month}` : "";

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={`${t.href}${qs}`}
            className={clsx(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
