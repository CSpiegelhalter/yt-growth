/**
 * Integration Test Setup
 *
 * This file provides utilities for integration tests:
 * - Database connection
 * - Test fixture creation
 * - Cleanup helpers
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LIMITS } from "@/lib/shared/product";

// Set test environment
process.env.DISABLE_RATE_LIMITS = "1";

// Use test database if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://yt_growth:yt_growth_dev@localhost:5432/channelboost_test?schema=public";
}

export const prisma = new PrismaClient();

/**
 * Create a test user for integration tests
 */
export async function createTestUser(
  email = "integration@test.com"
): Promise<{ id: number; email: string }> {
  const passwordHash = await bcrypt.hash("TestPassword123!", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Integration Test User",
      passwordHash,
    },
  });

  return { id: user.id, email: user.email };
}

/**
 * Create a test subscription for a user
 */
export async function createTestSubscription(
  userId: number,
  plan: "free" | "pro" = "free"
) {
  return prisma.subscription.upsert({
    where: { userId },
    update: {
      status: plan === "pro" ? "active" : "inactive",
      plan,
      channelLimit:
        plan === "pro"
          ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
          : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd:
        plan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    },
    create: {
      userId,
      status: plan === "pro" ? "active" : "inactive",
      plan,
      channelLimit:
        plan === "pro"
          ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
          : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd:
        plan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      stripeCustomerId: `cus_test_${userId}`,
    },
  });
}

/**
 * Clean up a test user and related data
 */
export async function cleanupTestUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {return;}

  // Delete in order of dependencies
  await prisma.usageCounter.deleteMany({ where: { userId: user.id } });
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

/**
 * Clean up usage counters for a user
 */
export async function cleanupUsageCounters(userId: number) {
  await prisma.usageCounter.deleteMany({ where: { userId } });
}
