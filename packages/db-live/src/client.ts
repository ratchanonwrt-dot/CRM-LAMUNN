import { PrismaClient } from ".prisma/client-live";

// Standard Next.js singleton pattern so hot-reload in dev doesn't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prismaLive?: PrismaClient };

export const prisma =
  globalForPrisma.prismaLive ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaLive = prisma;
