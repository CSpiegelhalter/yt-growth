/**
 * Reset Test Database
 *
 * This script:
 * 1. Drops all data from the test database
 * 2. Runs migrations
 * 3. Seeds minimal test fixtures
 *
 * Usage:
 *   bun scripts/test/reset-db.ts
 *
 * Environment:
 *   DATABASE_URL should point to the test database (channelboost_test)
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import bcrypt from "bcryptjs";
import { LIMITS } from "@/lib/shared/product";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Resetting test database...\n");

  const dbUrl = process.env.DATABASE_URL || "";
  console.log(`Database: ${dbUrl.replace(/:[^:]*@/, ":****@")}\n`);

  // Step 1: Truncate all tables (faster than dropping and recreating)
  console.log("Step 1: Truncating tables...");
  try {
    // Get all table names except _prisma_migrations
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `;

    // Truncate each table with CASCADE
    for (const { tablename } of tables) {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${tablename}" CASCADE`
      );
      console.log(`  ✓ Truncated ${tablename}`);
    }
    console.log("");
  } catch {
    console.log("  Tables may not exist yet, running migrations...\n");
  }

  // Step 2: Run migrations
  console.log("Step 2: Running migrations...");
  try {
    execSync("bunx prisma migrate deploy", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    console.log("");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  // Step 3: Seed test fixtures
  console.log("Step 3: Seeding test fixtures...");
  await seedTestFixtures();
  console.log("");

  console.log("✅ Test database reset complete!\n");
}

async function seedTestFixtures() {
  // Create E2E test user
  const e2ePasswordHash = await bcrypt.hash("Password123!", 10);
  const e2eUser = await prisma.user.upsert({
    where: { email: "e2e@example.com" },
    update: {},
    create: {
      email: "e2e@example.com",
      name: "E2E Test User",
      passwordHash: e2ePasswordHash,
    },
  });
  console.log(`  ✓ Created e2e user: ${e2eUser.email}`);

  await prisma.subscription.upsert({
    where: { userId: e2eUser.id },
    update: {},
    create: {
      userId: e2eUser.id,
      status: "inactive",
      plan: "free",
      channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      stripeCustomerId: "cus_e2e",
    },
  });
  console.log(`  ✓ Created e2e subscription (FREE)`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
