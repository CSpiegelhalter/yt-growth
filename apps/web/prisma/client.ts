import { PrismaClient } from "@prisma/client";

/**
 * Ensures the DATABASE_URL has reasonable pool settings for serverless.
 * With PgBouncer (connection_limit=1), concurrent queries within a single
 * request can starve and timeout. We bump connection_limit to 3 (still safe
 * for serverless) and pool_timeout to 20s so queued queries have time.
 */
function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw) {return raw;}

  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    const limit = parseInt(url.searchParams.get("connection_limit") ?? "", 10);
    if (!isNaN(limit) && limit < 3) {
      url.searchParams.set("connection_limit", "3");
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
