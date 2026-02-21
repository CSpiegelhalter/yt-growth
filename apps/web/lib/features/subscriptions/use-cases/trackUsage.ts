/**
 * Usage tracking operations — daily usage limits enforcement.
 *
 * All database I/O is performed via prisma (allowed in features per
 * architecture rules). Date helpers are imported from checkEntitlement.
 */
import "server-only";

import { prisma } from "@/prisma";
import type { FeatureKey, UsageCheckResult } from "../types";
import { getTodayDateKey, getResetAt } from "./checkEntitlement";

// ── Helpers ──────────────────────────────────────────────────

function getTodayDate(): Date {
  const dateKey = getTodayDateKey();
  return new Date(dateKey + "T00:00:00.000Z");
}

// ── Read operations ──────────────────────────────────────────

async function getUsage(
  userId: number,
  featureKey: FeatureKey,
): Promise<number> {
  const date = getTodayDate();
  const counter = await prisma.usageCounter.findUnique({
    where: {
      userId_date_featureKey: { userId, date, featureKey },
    },
  });
  return counter?.count ?? 0;
}

/**
 * Get usage info with limit context (useful for UI display).
 */
export async function getUsageInfo(
  userId: number,
  featureKey: FeatureKey,
  limit: number,
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
 * Check if usage is allowed and increment atomically if so.
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

  const existing = await prisma.usageCounter.findUnique({
    where: {
      userId_date_featureKey: { userId, date, featureKey },
    },
  });

  const currentCount = existing?.count ?? 0;

  if (currentCount + amount > limit) {
    return {
      allowed: false,
      used: currentCount,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt: resetAt.toISOString(),
    };
  }

  const updated = await prisma.usageCounter.upsert({
    where: {
      userId_date_featureKey: { userId, date, featureKey },
    },
    create: { userId, date, featureKey, count: amount },
    update: { count: { increment: amount } },
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
 * Check if action is allowed without incrementing (peek).
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

// ── Admin helpers ────────────────────────────────────────────

export async function resetUserUsage(userId: number): Promise<void> {
  const date = getTodayDate();
  await prisma.usageCounter.deleteMany({ where: { userId, date } });
}

export async function getAllUsage(
  userId: number,
): Promise<Array<{ featureKey: string; count: number }>> {
  const date = getTodayDate();
  return prisma.usageCounter.findMany({
    where: { userId, date },
    select: { featureKey: true, count: true },
  });
}
