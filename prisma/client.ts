import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    ...(process.env.DEBUG === "1" && {
      log: ["query", "info"],
    }),
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Cache in both development AND production to prevent connection pool exhaustion
// in serverless environments. The check for NODE_ENV !== "production" was causing
// multiple PrismaClient instances to be created in Vercel functions.
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? prismaClientSingleton();

globalForPrisma.prisma = prisma;
