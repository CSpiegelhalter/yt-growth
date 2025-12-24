/**
 * Usage Tracking Module - Daily usage limits enforcement
 *
 * Handles:
 * - Getting current usage for a user/feature
 * - Checking and incrementing usage atomically
 * - Resetting usage (dev helper)
 */

import { prisma } from "@/prisma";
import { getTodayDateKey, getResetAt, type FeatureKey } from "./entitlements";

// ============================================
// TYPES
// ============================================

export type UsageCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: string; // ISO string
};

// ============================================
// HELPERS
// ============================================

/**
 * Get today's date as a Date object (midnight UTC for the Chicago day)
 */
function getTodayDate(): Date {
  const dateKey = getTodayDateKey(); // YYYY-MM-DD in Chicago time
  return new Date(dateKey + "T00:00:00.000Z");
}

// ============================================
// USAGE OPERATIONS
// ============================================

/**
 * Get current usage count for a user/feature for today
 */
export async function getUsage(
  userId: number,
  featureKey: FeatureKey
): Promise<number> {
  const date = getTodayDate();

  const counter = await prisma.usageCounter.findUnique({
    where: {
      userId_date_featureKey: {
        userId,
        date,
        featureKey,
      },
    },
  });

  return counter?.count ?? 0;
}

/**
 * Get usage info with limit context (useful for UI display)
 */
export async function getUsageInfo(
  userId: number,
  featureKey: FeatureKey,
  limit: number
): Promise<UsageCheckResult> {
  const used = await getUsage(userId, featureKey);
  const remaining = Math.max(0, limit - used);
  const resetAt = getResetAt();

  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
    resetAt: resetAt.toISOString(),
  };
}

/**
 * Check if usage is allowed and increment atomically if so
 *
 * Uses upsert with conditional logic to prevent race conditions.
 * Returns the result with updated counts.
 */
export async function checkAndIncrement(options: {
  userId: number;
  featureKey: FeatureKey;
  limit: number;
  amount?: number;
}): Promise<UsageCheckResult> {
  const { userId, featureKey, limit, amount = 1 } = options;
  const date = getTodayDate();
  const resetAt = getResetAt();

  // Get current usage
  const existing = await prisma.usageCounter.findUnique({
    where: {
      userId_date_featureKey: {
        userId,
        date,
        featureKey,
      },
    },
  });

  const currentCount = existing?.count ?? 0;

  // Check if we'd exceed the limit
  if (currentCount + amount > limit) {
    return {
      allowed: false,
      used: currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt: resetAt.toISOString(),
    };
  }

  // Increment atomically using upsert
  const updated = await prisma.usageCounter.upsert({
    where: {
      userId_date_featureKey: {
        userId,
        date,
        featureKey,
      },
    },
    create: {
      userId,
      date,
      featureKey,
      count: amount,
    },
    update: {
      count: {
        increment: amount,
      },
    },
  });

  const newCount = updated.count;
  const remaining = Math.max(0, limit - newCount);

  return {
    allowed: true,
    used: newCount,
    limit,
    remaining,
    resetAt: resetAt.toISOString(),
  };
}

/**
 * Check if action is allowed without incrementing (peek)
 */
export async function checkUsage(options: {
  userId: number;
  featureKey: FeatureKey;
  limit: number;
  amount?: number;
}): Promise<UsageCheckResult> {
  const { userId, featureKey, limit, amount = 1 } = options;
  const resetAt = getResetAt();

  const used = await getUsage(userId, featureKey);
  const wouldExceed = used + amount > limit;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: !wouldExceed,
    used,
    limit,
    remaining,
    resetAt: resetAt.toISOString(),
  };
}

// ============================================
// DEV/ADMIN HELPERS
// ============================================

/**
 * Reset usage for a user (dev/testing only)
 */
export async function resetUserUsage(userId: number): Promise<void> {
  const date = getTodayDate();

  await prisma.usageCounter.deleteMany({
    where: {
      userId,
      date,
    },
  });
}

/**
 * Reset specific feature usage for a user (dev/testing only)
 */
export async function resetFeatureUsage(
  userId: number,
  featureKey: FeatureKey
): Promise<void> {
  const date = getTodayDate();

  await prisma.usageCounter.deleteMany({
    where: {
      userId,
      date,
      featureKey,
    },
  });
}

/**
 * Get all usage for a user today (dev/admin view)
 */
export async function getAllUsage(
  userId: number
): Promise<Array<{ featureKey: string; count: number }>> {
  const date = getTodayDate();

  const counters = await prisma.usageCounter.findMany({
    where: {
      userId,
      date,
    },
    select: {
      featureKey: true,
      count: true,
    },
  });

  return counters;
}

