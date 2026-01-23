/**
 * Database seed script
 *
 * Creates initial data for development.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Feature flag definitions for seeding.
 * Add new flags here when needed.
 */
const FEATURE_FLAGS = [
  {
    key: "thumbnail_generation",
    enabled: false, // Safe default: disabled until explicitly enabled
    description: "Enable the AI thumbnail generation feature",
  },
  {
    key: "trending_search",
    enabled: false,
    description: "Enable trending search discovery feature (coming soon)",
  },
] as const;

async function seedFeatureFlags() {
  console.log("🚩 Seeding feature flags...");

  for (const flag of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        // Don't update enabled status - preserve manual changes
        description: flag.description,
      },
      create: {
        key: flag.key,
        enabled: flag.enabled,
        description: flag.description,
      },
    });
    console.log(`  ✓ ${flag.key}: ${flag.enabled ? "enabled" : "disabled"}`);
  }
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // Seed feature flags
  await seedFeatureFlags();
  console.log("");

  // Seed dev user
  const email = "user@example.com";
  const password = "Password123!";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Dev User",
      passwordHash,
    },
  });
  console.log(`✅ Created dev user: ${user.email} (password: ${password})`);

  console.log("\n✨ Seed completed!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
