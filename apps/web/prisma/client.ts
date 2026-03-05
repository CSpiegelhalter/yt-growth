import { PrismaClient } from "@prisma/client";

/**
 * Ensures the DATABASE_URL has reasonable pool settings for serverless.
 * In serverless (Vercel), each function instance gets its own PrismaClient.
 * With connection_limit > 1, concurrent functions can exhaust the PgBouncer
 * pool (e.g. 8 functions × 3 connections = 24, hitting the pool cap).
 * We default to connection_limit=1 so each function uses a single connection,
 * letting PgBouncer handle the multiplexing.
 */
function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw) {return raw;}

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    ...(process.env.DEBUG === "1" && {
      log: ["query", "info"],
    }),
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? prismaClientSingleton();

// Cache in all environments to prevent connection pool exhaustion in serverless
globalForPrisma.prisma = prisma;
