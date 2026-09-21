import { PrismaClient } from ".prisma/client-catering";

// Standard Next.js singleton pattern so hot-reload in dev doesn't exhaust DB connections.
const globalForPrisma = globalThis as unknown as { prismaCatering?: PrismaClient };

export const prisma =
  globalForPrisma.prismaCatering ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaCatering = prisma;
