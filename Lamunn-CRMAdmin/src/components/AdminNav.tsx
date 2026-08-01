"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import clsx from "clsx";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  Award,
  Percent,
  Gift,
  QrCode,
  ScanLine,
  BarChart3,
  Palette,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบ (ทุกสาขา)",
  BRANCH_MANAGER: "ผู้จัดการสาขา",
  STAFF: "พนักงาน",
  MARKETING: "ทีมการตลาด",
};

const allLinks = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, color: "bg-sky-100 text-sky-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF", "MARKETING"] },
  { href: "/admin/branches", label: "สาขา", icon: Building2, color: "bg-violet-100 text-violet-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/staff", label: "พนักงาน", icon: Users, color: "bg-indigo-100 text-indigo-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/customers", label: "ลูกค้า", icon: UserRound, color: "bg-pink-100 text-pink-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/tiers", label: "ระดับสมาชิก", icon: Award, color: "bg-fuchsia-100 text-fuchsia-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/point-rules", label: "กติกาสะสมแต้ม", icon: Percent, color: "bg-orange-100 text-orange-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/rewards", label: "รางวัล", icon: Gift, color: "bg-emerald-100 text-emerald-400", roles: ["SUPER_ADMIN", "MARKETING"] },
  { href: "/admin/redemptions", label: "ยืนยันแลกรางวัล", icon: QrCode, color: "bg-teal-100 text-teal-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/reports", label: "รายงาน", icon: BarChart3, color: "bg-cyan-100 text-cyan-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/settings", label: "ตั้งค่าหน้าตาแอป", icon: Palette, color: "bg-rose-100 text-rose-400", roles: ["SUPER_ADMIN", "MARKETING"] },
  { href: "/admin/audit-log", label: "ประวัติการแก้ไข", icon: History, color: "bg-slate-100 text-slate-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/qr-simulator", label: "จำลอง QR (ทดสอบ)", icon: ScanLine, color: "bg-amber-100 text-amber-400", roles: ["SUPER_ADMIN"] },
];

function NavLinks({ links, pathname, onNavigate }: { links: typeof allLinks; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
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
  );
}

export default function AdminNav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));
  const [open, setOpen] = useState(false);

  const profileBlock = (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shadow-inner">
        {name.slice(0, 1) || "?"}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{roleLabel[role] ?? role}</p>
      </div>
    </div>
  );

  const signOutButton = (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <LogOut size={15} strokeWidth={2.4} />
      </span>
      ออกจากระบบ
    </button>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
        >
          <Menu size={22} />
        </button>
        <p className="font-semibold text-gray-800">{name}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {name.slice(0, 1) || "?"}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-white px-4 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              {profileBlock}
              <button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <NavLinks links={links} pathname={pathname} onNavigate={() => setOpen(false)} />
            {signOutButton}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
        {profileBlock}
        <NavLinks links={links} pathname={pathname} />
        {signOutButton}
      </aside>
    </>
  );
}
