"use client";

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
  LogOut,
} from "lucide-react";

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "ผู้ดูแลระบบ (ทุกสาขา)",
  BRANCH_MANAGER: "ผู้จัดการสาขา",
  STAFF: "พนักงาน",
};

const allLinks = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, color: "bg-sky-100 text-sky-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/branches", label: "สาขา", icon: Building2, color: "bg-violet-100 text-violet-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/staff", label: "พนักงาน", icon: Users, color: "bg-indigo-100 text-indigo-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/customers", label: "ลูกค้า", icon: UserRound, color: "bg-pink-100 text-pink-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/tiers", label: "ระดับสมาชิก", icon: Award, color: "bg-fuchsia-100 text-fuchsia-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/point-rules", label: "กติกาสะสมแต้ม", icon: Percent, color: "bg-orange-100 text-orange-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/rewards", label: "รางวัล", icon: Gift, color: "bg-emerald-100 text-emerald-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/redemptions", label: "ยืนยันแลกรางวัล", icon: QrCode, color: "bg-teal-100 text-teal-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/reports", label: "รายงาน", icon: BarChart3, color: "bg-cyan-100 text-cyan-400", roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/settings", label: "ตั้งค่าหน้าตาแอป", icon: Palette, color: "bg-rose-100 text-rose-400", roles: ["SUPER_ADMIN"] },
  { href: "/admin/qr-simulator", label: "จำลอง QR (ทดสอบ)", icon: ScanLine, color: "bg-amber-100 text-amber-400", roles: ["SUPER_ADMIN"] },
];

export default function AdminNav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6">
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
          const active = pathname === link.href;
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
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
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
