"use client";

import { Printer } from "lucide-react";

/** ปุ่มสั่งพิมพ์ — แยกเป็น client component เพราะหน้าใบสำคัญเป็น server component */
export default function PrintButton({ label = "พิมพ์ใบสำคัญ" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
    >
      <Printer size={15} />
      {label}
    </button>
  );
}
