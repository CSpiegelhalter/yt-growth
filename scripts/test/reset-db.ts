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
import { LIMITS } from "@/lib/product";

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
  // Create a demo user for existing tests (backwards compatibility)
  const demoPasswordHash = await bcrypt.hash("demo123", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: demoPasswordHash,
    },
  });
  console.log(`  ✓ Created demo user: ${demoUser.email}`);

  // Create demo subscription (PRO)
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      status: "active",
      plan: "pro",
      channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: "cus_demo",
      stripeSubscriptionId: "sub_demo",
    },
  });
  console.log(`  ✓ Created demo subscription (PRO)`);

  // Create a demo channel
  const demoGoogleAccount = await prisma.googleAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: "demo_google_account",
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      provider: "google",
      providerAccountId: "demo_google_account",
      refreshTokenEnc: "demo_refresh_token",
      scopes: "https://www.googleapis.com/auth/youtube.readonly",
      tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const demoChannel = await prisma.channel.upsert({
    where: {
      userId_youtubeChannelId: {
        userId: demoUser.id,
        youtubeChannelId: "UC_demo_channel_123",
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      youtubeChannelId: "UC_demo_channel_123",
      title: "Demo Tech Channel",
      thumbnailUrl: "https://picsum.photos/seed/demo/88/88",
      totalVideoCount: 50,
      subscriberCount: 25000,
      lastSyncedAt: new Date(),
      syncStatus: "idle",
      googleAccountId: demoGoogleAccount.id,
    },
  });
  console.log(`  ✓ Created demo channel: ${demoChannel.title}`);

  // Create some demo videos
  for (let i = 0; i < 10; i++) {
    await prisma.video.upsert({
      where: {
        channelId_youtubeVideoId: {
          channelId: demoChannel.id,
          youtubeVideoId: `demo_vid_${i}`,
        },
      },
      update: {},
      create: {
        channelId: demoChannel.id,
        youtubeVideoId: `demo_vid_${i}`,
        title: `Demo Video ${i + 1}: YouTube Growth Tips`,
        description: `This is demo video ${i + 1}`,
        publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        durationSec: 300 + i * 60,
        tags: "demo,youtube,growth",
        categoryId: "22",
        thumbnailUrl: `https://picsum.photos/seed/demo_vid_${i}/320/180`,
      },
    });
  }
  console.log(`  ✓ Created 10 demo videos`);

  // Create a free user for testing
  const freePasswordHash = await bcrypt.hash("demo123", 10);
  const freeUser = await prisma.user.upsert({
    where: { email: "free@example.com" },
    update: {},
    create: {
      email: "free@example.com",
      name: "Free User",
      passwordHash: freePasswordHash,
    },
  });
  console.log(`  ✓ Created free user: ${freeUser.email}`);

  // Create free subscription
  await prisma.subscription.upsert({
    where: { userId: freeUser.id },
    update: {},
    create: {
      userId: freeUser.id,
      status: "inactive",
      plan: "free",
      channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      stripeCustomerId: "cus_free",
    },
  });
  console.log(`  ✓ Created free subscription`);

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
