import { PrismaClient } from "./generated/client";

// Standard Next.js singleton pattern so hot-reload in dev doesn't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prismaFinance?: PrismaClient };

export const prisma =
  globalForPrisma.prismaFinance ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaFinance = prisma;
