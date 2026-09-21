"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/requireStaff";
import type { PermissionMap, PermissionSection } from "@/lib/permissions";

interface RoleContextValue {
  role: Role;
  permissions: PermissionMap;
}

const RoleContext = createContext<RoleContextValue>({
  role: "STAFF",
  permissions: {} as PermissionMap,
});

export function RoleProvider({
  role,
  permissions,
  children,
}: {
  role: Role;
  permissions: PermissionMap;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={{ role, permissions }}>{children}</RoleContext.Provider>;
}

/** true ถ้าตำแหน่งนี้แก้ไข/กรอกข้อมูลในส่วนนี้ได้ ตามที่กำหนดไว้ในหน้า "จัดการสิทธิ์ตำแหน่ง" */
export function useCanEdit(section: PermissionSection): boolean {
  const { role, permissions } = useContext(RoleContext);
  if (role === "SUPER_ADMIN") return true;
  return permissions[section]?.canEdit ?? false;
}

export function useRole(): Role {
  return useContext(RoleContext).role;
}
