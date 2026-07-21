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
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/branches", label: "สาขา", icon: Building2, roles: ["SUPER_ADMIN"] },
  { href: "/admin/staff", label: "พนักงาน", icon: Users, roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/customers", label: "ลูกค้า", icon: UserRound, roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/point-rules", label: "กติกาสะสมแต้ม", icon: Percent, roles: ["SUPER_ADMIN", "BRANCH_MANAGER"] },
  { href: "/admin/rewards", label: "รางวัล", icon: Gift, roles: ["SUPER_ADMIN"] },
  { href: "/admin/redemptions", label: "ยืนยันแลกรางวัล", icon: QrCode, roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/reports", label: "รายงาน", icon: BarChart3, roles: ["SUPER_ADMIN", "BRANCH_MANAGER", "STAFF"] },
  { href: "/admin/settings", label: "ตั้งค่าหน้าตาแอป", icon: Palette, roles: ["SUPER_ADMIN"] },
  { href: "/admin/qr-simulator", label: "จำลอง QR (ทดสอบ)", icon: ScanLine, roles: ["SUPER_ADMIN"] },
];

export default function AdminNav({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const links = allLinks.filter((l) => l.roles.includes(role));

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
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
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                pathname === link.href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon size={17} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-100"
      >
        <LogOut size={17} />
        ออกจากระบบ
      </button>
    </aside>
  );
}
