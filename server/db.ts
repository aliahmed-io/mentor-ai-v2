import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Generic retry helper for transient connection issues (e.g., ECONNRESET)
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 250,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = typeof err === "object" && err && "message" in err ? String((err as any).message) : String(err);
      // Match common transient connection messages
      const isTransient =
        msg.includes("ECONNRESET") ||
        msg.includes("Connection reset") ||
        msg.includes("forcibly closed by the remote host") ||
        msg.includes("Error in PostgreSQL connection");
      if (!isTransient || attempt === retries) {
        throw err;
      }
      lastError = err;
      // Small backoff before retry
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError as any;
}