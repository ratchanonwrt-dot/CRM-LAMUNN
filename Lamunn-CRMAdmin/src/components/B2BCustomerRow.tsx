"use client";

import Link from "next/link";
import { Briefcase, ChevronRight } from "lucide-react";
import DeleteButton from "@/components/DeleteButton";

interface B2BCustomer {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  totalSpend: number;
  isActive: boolean;
}

export default function B2BCustomerRow({ customer, tierName }: { customer: B2BCustomer; tierName: string | null }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
            <Briefcase size={16} strokeWidth={2.2} />
          </span>
          <span className="font-medium text-gray-800">{customer.companyName}</span>
        </div>
      </td>
      <td className="px-4 py-2 text-gray-500">{customer.contactName ?? "-"}</td>
      <td className="px-4 py-2 text-gray-500">{customer.phone ?? "-"}</td>
      <td className="px-4 py-2 text-gray-500">{customer.totalSpend.toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท</td>
      <td className="px-4 py-2">
        {tierName ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{tierName}</span>
        ) : (
          <span className="text-xs text-gray-400">ยังไม่ถึงระดับ</span>
        )}
      </td>
      <td className="px-4 py-2">
        {customer.isActive ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">ใช้งานอยู่</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">ปิดใช้งาน</span>
        )}
      </td>
      <td className="px-4 py-2">
        <Link href={`/admin/b2b/${customer.id}`} className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          รายละเอียด
          <ChevronRight size={12} />
        </Link>
      </td>
      <td className="px-4 py-2">
        <DeleteButton endpoint={`/api/admin/b2b/${customer.id}`} confirmMessage={`ลบลูกค้า "${customer.companyName}" ใช่ไหม?`} />
      </td>
    </tr>
  );
}
