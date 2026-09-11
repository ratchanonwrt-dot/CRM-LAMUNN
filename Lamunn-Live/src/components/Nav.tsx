"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import { LayoutDashboard, CalendarDays, Inbox, Radio, BarChart3, Wallet, Users, Tv, UserCog, LogOut, Menu, X } from "lucide-react";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด",
  MANAGER: "ผู้จัดการ",
  STAFF: "พนักงาน (บันทึกยอด)",
};

const ALL_ROLES = ["SUPER_ADMIN", "MANAGER", "STAFF"];
const EDITOR_ROLES = ["SUPER_ADMIN", "MANAGER"];

const mainLinks = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard, color: "bg-sky-100 text-sky-500", roles: ALL_ROLES },
  { href: "/schedule", label: "ตารางไลฟ์", icon: CalendarDays, color: "bg-amber-100 text-amber-600", roles: ALL_ROLES },
  { href: "/requests", label: "คำขอจองกะ", icon: Inbox, color: "bg-orange-100 text-orange-600", roles: ALL_ROLES },
  { href: "/sessions", label: "บันทึกรอบไลฟ์", icon: Radio, color: "bg-rose-100 text-rose-500", roles: ALL_ROLES },
  { href: "/analysis", label: "วิเคราะห์", icon: BarChart3, color: "bg-blue-100 text-blue-500", roles: ALL_ROLES },
  { href: "/commission", label: "ค่าคอมมิชชั่น", icon: Wallet, color: "bg-emerald-100 text-emerald-600", roles: ALL_ROLES },
];

const otherLinks = [
  { href: "/streamers", label: "คนไลฟ์", icon: Users, color: "bg-indigo-100 text-indigo-500", roles: EDITOR_ROLES },
  { href: "/channels", label: "ช่องทางไลฟ์", icon: Tv, color: "bg-slate-100 text-slate-500", roles: EDITOR_ROLES },
  { href: "/staff", label: "จัดการผู้ใช้งาน", icon: UserCog, color: "bg-fuchsia-100 text-fuchsia-500", roles: ["SUPER_ADMIN"] },
];

export default function Nav({ role, name, pendingRequests = 0 }: { role: string; name: string; pendingRequests?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const main = mainLinks.filter((l) => l.roles.includes(role));
  const other = otherLinks.filter((l) => l.roles.includes(role));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function renderLink(link: (typeof mainLinks)[number], small?: boolean) {
    const Icon = link.icon;
    const active = pathname === link.href || pathname.startsWith(link.href + "/") || (link.href === "/schedule" && pathname.startsWith("/shifts/"));
    return (
      <Link
        key={link.href}
        href={link.href}
        className={clsx(
          "flex items-center gap-2.5 rounded-xl transition-colors",
          small ? "px-2.5 py-1.5 text-xs font-medium" : "px-2.5 py-2 text-sm font-medium",
          active ? "bg-brand-50 text-brand-700" : small ? "text-gray-500 hover:bg-gray-50" : "text-gray-600 hover:bg-gray-50"
        )}
      >
        <span className={clsx("flex shrink-0 items-center justify-center rounded-full", small ? "h-6 w-6" : "h-7 w-7", link.color)}>
          <Icon size={small ? 13 : 15} strokeWidth={2.4} />
        </span>
        {link.label}
        {link.href === "/requests" && pendingRequests > 0 && (
          <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{pendingRequests}</span>
        )}
      </Link>
    );
  }

  const navBody = (
    <>
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
        {main.map((link) => renderLink(link))}
        {other.length > 0 && (
          <>
            <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-300">ตั้งค่า</p>
            {other.map((link) => renderLink(link, true))}
          </>
        )}
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
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {name.slice(0, 1) || "?"}
          </div>
          <p className="text-sm font-semibold text-gray-800">{name}</p>
        </div>
        <button onClick={() => setOpen(true)} aria-label="เปิดเมนู" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50">
          <Menu size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white px-4 py-6 shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="mb-4 flex h-8 w-8 items-center justify-center self-end rounded-lg text-gray-400 hover:bg-gray-50">
              <X size={18} />
            </button>
            {navBody}
          </aside>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">{navBody}</aside>
    </>
  );
}
