"use client";

import { createContext, useContext } from "react";
import type { Role } from "@/lib/requireStaff";

const RoleContext = createContext<Role>("STAFF");

export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

/** true ถ้าสิทธิ์นี้แก้ไขตั้งค่า/ลบข้อมูลได้ (STAFF บันทึกยอดได้ แต่ลบ/ตั้งค่าไม่ได้) */
export function useCanEdit(): boolean {
  const role = useContext(RoleContext);
  return role !== "STAFF";
}

export function useRole(): Role {
  return useContext(RoleContext);
}
