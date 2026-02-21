/**
 * Entitlements Enforcement Wrapper
 *
 * Thin orchestration layer that wires the subscriptions feature domain
 * to concrete I/O (user session, Stripe status, usage counters).
 *
 * Route handlers call these functions; the actual business logic lives
 * in lib/features/subscriptions/.
 */

import {
  getCurrentUserWithSubscription,
  type AuthUserWithSubscription,
} from "@/lib/server/auth";
import { getSubscriptionStatus } from "./stripe";
import {
  checkEntitlement as checkEntitlementCore,
  checkChannelLimit as checkChannelLimitCore,
} from "@/lib/features/subscriptions";
import type {
  Plan,
  FeatureKey,
  EntitlementError as EntitlementErrorType,
  UsageCheckResult,
} from "@/lib/features/subscriptions";
import {
  checkAndIncrement,
  getUsageInfo,
} from "@/lib/features/subscriptions/use-cases/trackUsage";

type EntitlementContext = {
  user: AuthUserWithSubscription;
  plan: Plan;
  usage: UsageCheckResult | null;
};

type LegacyEntitlementCheckResult =
  | { ok: true; context: EntitlementContext }
  | { ok: false; error: EntitlementErrorType };

/**
 * Check entitlements for a feature access.
 *
 * Wraps the pure domain use-case with concrete I/O callbacks.
 */
export async function checkEntitlement(options: {
  featureKey: FeatureKey;
  increment?: boolean;
  amount?: number;
}): Promise<LegacyEntitlementCheckResult> {
  const user = await getCurrentUserWithSubscription();

  const result = await checkEntitlementCore({
    ...options,
    getUser: async () => (user ? { id: user.id } : null),
    getSubscriptionStatus: async (userId: number) => {
      const sub = await getSubscriptionStatus(userId);
      return {
        isActive: sub.isActive,
        plan: sub.plan,
        currentPeriodEnd: sub.currentPeriodEnd,
      };
    },
    checkAndIncrement,
    getUsageInfo,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    context: {
      user: user!,
      plan: result.context.plan,
      usage: result.context.usage,
    },
  };
}

/**
 * Convert entitlement error to Response.
 */
export function entitlementErrorResponse(
  error: EntitlementErrorType,
): Response {
  return Response.json(error.body, { status: error.status });
}

/**
 * Check if user can connect another channel.
 */
export async function checkChannelLimit(userId: number): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}> {
  const { prisma } = await import("@/prisma");

  return checkChannelLimitCore({
    userId,
    getSubscriptionStatus: async (uid: number) => {
      const sub = await getSubscriptionStatus(uid);
      return {
        isActive: sub.isActive,
        plan: sub.plan,
        currentPeriodEnd: sub.currentPeriodEnd,
      };
    },
    getChannelCount: async (uid: number) =>
      prisma.channel.count({ where: { userId: uid } }),
  });
}
