/**
 * Authorization helpers
 *
 * Server-side authorization checks. NEVER trust client-side authorization.
 */

import { prisma } from "@/prisma";
import type { AuthUserWithSubscription } from "@/lib/user";

export type AuthzResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(
  user: AuthUserWithSubscription
): AuthzResult {
  const sub = user.subscription;

  if (!sub) {
    return { allowed: false, reason: "No subscription found" };
  }

  if (sub.plan === "free") {
    return { allowed: false, reason: "Free plan - subscription required" };
  }

  // Check if within valid period
  const effectiveEnd =
    sub.cancelAt && sub.currentPeriodEnd
      ? sub.cancelAt.getTime() <= sub.currentPeriodEnd.getTime()
        ? sub.cancelAt
        : sub.currentPeriodEnd
      : sub.cancelAt ?? sub.currentPeriodEnd;

  if (effectiveEnd && effectiveEnd.getTime() <= Date.now()) {
    return { allowed: false, reason: "Subscription expired" };
  }

  const validStatuses = ["active", "trialing", "past_due"];
  if (!validStatuses.includes(sub.status)) {
    return {
      allowed: false,
      reason: `Invalid subscription status: ${sub.status}`,
    };
  }

  return { allowed: true };
}

/**
 * Check channel limit for user
 */
export async function checkChannelLimit(
  userId: number,
  currentCount?: number
): Promise<AuthzResult & { limit: number; current: number }> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { channelLimit: true, plan: true },
  });

  const limit = sub?.channelLimit ?? 1;

  const count =
    currentCount ?? (await prisma.channel.count({ where: { userId } }));

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Channel limit reached (${count}/${limit})`,
      limit,
      current: count,
    };
  }

  return { allowed: true, limit, current: count };
}
