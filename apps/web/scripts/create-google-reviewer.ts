/**
 * Create Google Reviewer Test Account
 *
 * Creates a test user with Pro access for Google's OAuth verification team.
 * Run against PRODUCTION database with:
 *
 *   DATABASE_URL="your-prod-url" npx tsx scripts/create-google-reviewer.ts
 *
 * Or if using Prisma with directUrl:
 *   DATABASE_URL="your-prod-url" DIRECT_DATABASE_URL="your-prod-direct-url" npx tsx scripts/create-google-reviewer.ts
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { LIMITS } from "@/lib/shared/product";

const prisma = new PrismaClient();

// ============================================
// CONFIGURE THESE FOR GOOGLE REVIEW
// ============================================
const REVIEWER_EMAIL = "google-reviewer@test.channelboost.app";
const REVIEWER_PASSWORD = "GoogleReview2026!"; // Strong password for security
const REVIEWER_NAME = "Google Reviewer";

// Set expiration far in the future (1 year from now)
const SUBSCRIPTION_EXPIRES = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

async function main() {
  console.log("🔐 Creating Google Reviewer test account...\n");
  console.log(`📧 Email: ${REVIEWER_EMAIL}`);
  console.log(`🔑 Password: ${REVIEWER_PASSWORD}`);
  console.log(`📅 Pro expires: ${SUBSCRIPTION_EXPIRES.toISOString()}\n`);

  // Hash the password
  const passwordHash = await bcrypt.hash(REVIEWER_PASSWORD, 12);

  // Create or update the reviewer user
  const user = await prisma.user.upsert({
    where: { email: REVIEWER_EMAIL },
    update: {
      name: REVIEWER_NAME,
      passwordHash,
    },
    create: {
      email: REVIEWER_EMAIL,
      name: REVIEWER_NAME,
      passwordHash,
    },
  });
  console.log(`✅ User created/updated: ID ${user.id}`);

  // Create or update subscription with Pro access
  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {
      status: "active",
      plan: "pro",
      channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: SUBSCRIPTION_EXPIRES,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: null,
    },
    create: {
      userId: user.id,
      status: "active",
      plan: "pro",
      channelLimit: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: SUBSCRIPTION_EXPIRES,
      // No Stripe IDs - this is a manual/test subscription
      stripeCustomerId: "manual_google_reviewer",
      stripeSubscriptionId: "manual_google_reviewer",
    },
  });
  console.log(
    `✅ Pro subscription created: expires ${subscription.currentPeriodEnd?.toISOString()}`
  );

  console.log("\n" + "=".repeat(50));
  console.log("📋 GOOGLE REVIEWER TEST CREDENTIALS");
  console.log("=".repeat(50));
  console.log(`Email:    ${REVIEWER_EMAIL}`);
  console.log(`Password: ${REVIEWER_PASSWORD}`);
  console.log(`Plan:     Pro (active)`);
  console.log(`Expires:  ${SUBSCRIPTION_EXPIRES.toLocaleDateString()}`);
  console.log("=".repeat(50));
  console.log(
    "\n✨ Done! Google's team can now log in with these credentials.\n"
  );
}

main()
  .catch((e) => {
    console.error("❌ Failed to create reviewer account:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
