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

// Generic retry helper for transient connection issues (e.g., ECONNRESET, P1001, P2024)
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      // Also check Prisma error code for P1001 / P2024
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      // Match common transient connection messages and Prisma pool/connectivity codes
      const isTransient =
        msg.includes("ECONNRESET") ||
        msg.includes("Connection reset") ||
        msg.includes("forcibly closed by the remote host") ||
        msg.includes("Error in PostgreSQL connection") ||
        msg.includes("Can't reach database server") ||
        msg.includes("connection pool") ||
        code === "P1001" || // Can't reach database server
        code === "P2024" || // Connection pool timeout
        code === "P2034"; // Transaction failed due to a write conflict or a deadlock
      if (!isTransient || attempt === retries) {
        throw err;
      }
      lastError = err;
      // Exponential backoff before retry with jitter to prevent thundering herd/starvation
      const jitter = Math.random() * 100;
      await new Promise((r) => setTimeout(r, delayMs * 2 ** attempt + jitter));
    }
  }
  throw lastError as Error;
}
