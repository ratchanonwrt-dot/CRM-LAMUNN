import { prisma } from "./client";
import type { StaffRole, Prisma } from "@prisma/client";

export async function logAudit(input: {
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId?: string;
  summary: string;
  changes?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      staffId: input.staffId,
      staffName: input.staffName,
      staffRole: input.staffRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      changes: input.changes as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getAuditLogs(limit = 200) {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
