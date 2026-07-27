"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import {
  LayoutDashboard,
  NotebookPen,
  Store,
  Building2,
  Clock,
  Wallet,
  Tent,
  BarChart3,
  ReceiptText,
  Landmark,
  SlidersHorizontal,
  CalendarDays,
  LogOut,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "พนักงาน",
};

const allLinks = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, color: "bg-sky-100 text-sky-500", roles: ["ADMIN", "STAFF"] },
  { href: "/reports", label: "รายงาน/วิเคราะห์", icon: BarChart3, color: "bg-blue-100 text-blue-500", roles: ["ADMIN", "STAFF"] },
  { href: "/entry/daily", label: "กรอกยอดรายสาขา", icon: NotebookPen, color: "bg-emerald-100 text-emerald-500", roles: ["ADMIN", "STAFF"] },
  { href: "/monthly", label: "ยอดขายรายวัน (รายเดือน)", icon: CalendarDays, color: "bg-indigo-100 text-indigo-500", roles: ["ADMIN", "STAFF"] },
  { href: "/entry/company", label: "กรอกยอด E-Commerce กลาง", icon: Store, color: "bg-teal-100 text-teal-500", roles: ["ADMIN", "STAFF"] },
  { href: "/credit-term", label: "Credit Term", icon: Clock, color: "bg-amber-100 text-amber-500", roles: ["ADMIN", "STAFF"] },
  { href: "/rent", label: "ค่าเช่า", icon: Landmark, color: "bg-orange-100 text-orange-500", roles: ["ADMIN", "STAFF"] },
  { href: "/cash-status", label: "สถานะเงินสด", icon: Wallet, color: "bg-violet-100 text-violet-500", roles: ["ADMIN", "STAFF"] },
  { href: "/reconciliation", label: "เช็คยอด POS", icon: ReceiptText, color: "bg-rose-100 text-rose-500", roles: ["ADMIN", "STAFF"] },
  { href: "/deposits", label: "เงินเข้าบัญชี", icon: Landmark, color: "bg-cyan-100 text-cyan-500", roles: ["ADMIN", "STAFF"] },
  { href: "/events", label: "Event ชั่วคราว", icon: Tent, color: "bg-pink-100 text-pink-500", roles: ["ADMIN", "STAFF"] },
  { href: "/branches", label: "ตั้งค่าสาขา/ค่าเช่า", icon: Building2, color: "bg-slate-100 text-slate-500", roles: ["ADMIN"] },
  { href: "/settings", label: "ตั้งค่าระบบ", icon: SlidersHorizontal, color: "bg-gray-200 text-gray-600", roles: ["ADMIN"] },
];

export default function Nav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shadow-inner">
          {name.slice(0, 1) || "?"}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400">{roleLabel[role] ?? role}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className={clsx("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", link.color)}>
                <Icon size={15} strokeWidth={2.4} />
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <LogOut size={15} strokeWidth={2.4} />
        </span>
        ออกจากระบบ
      </button>
    </aside>
  );
}
