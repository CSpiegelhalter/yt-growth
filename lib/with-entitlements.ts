/**
 * Entitlements Enforcement Wrapper
 *
 * Provides a utility for API routes to:
 * - Load the current user and determine their plan
 * - Check if a feature is locked
 * - Enforce usage limits
 * - Return standardized error responses
 */

import { getCurrentUserWithSubscription, type AuthUserWithSubscription } from "./user";
import { getSubscriptionStatus } from "./stripe";
import {
  getPlanFromSubscription,
  featureLocked,
  getLimit,
  getFeatureDisplayName,
  type Plan,
  type FeatureKey,
} from "./entitlements";
import { checkAndIncrement, getUsageInfo, type UsageCheckResult } from "./usage";

// ============================================
// TYPES
// ============================================

export type EntitlementContext = {
  user: AuthUserWithSubscription;
  plan: Plan;
  usage: UsageCheckResult | null;
};

export type EntitlementError =
  | {
      type: "unauthorized";
      status: 401;
      body: { error: string };
    }
  | {
      type: "feature_locked";
      status: 403;
      body: {
        error: "upgrade_required";
        featureKey: string;
        message: string;
      };
    }
  | {
      type: "limit_reached";
      status: 403;
      body: {
        error: "limit_reached";
        featureKey: string;
        used: number;
        limit: number;
        remaining: number;
        resetAt: string;
        upgrade: boolean;
      };
    };

export type EntitlementCheckResult =
  | { ok: true; context: EntitlementContext }
  | { ok: false; error: EntitlementError };

// ============================================
// MAIN ENFORCEMENT FUNCTION
// ============================================

/**
 * Check entitlements for a feature access
 *
 * Use cases:
 * 1. Feature lock check only (e.g., keyword_research)
 * 2. Usage limit check + increment (e.g., owned_video_analysis)
 * 3. Account limit check (e.g., channels_connected) - handled separately
 *
 * @param options.featureKey - The feature being accessed
 * @param options.increment - Whether to increment usage (default: true for usage-limited features)
 * @param options.amount - How much to increment (default: 1)
 */
export async function checkEntitlement(options: {
  featureKey: FeatureKey;
  increment?: boolean;
  amount?: number;
}): Promise<EntitlementCheckResult> {
  const { featureKey, increment = true, amount = 1 } = options;

  // 1. Load user
  const user = await getCurrentUserWithSubscription();
  if (!user) {
    return {
      ok: false,
      error: {
        type: "unauthorized",
        status: 401,
        body: { error: "Unauthorized" },
      },
    };
  }

  // 2. Determine plan
  const subscription = await getSubscriptionStatus(user.id);
  const plan = getPlanFromSubscription(subscription);

  // 3. Check feature lock
  if (featureLocked(plan, featureKey)) {
    return {
      ok: false,
      error: {
        type: "feature_locked",
        status: 403,
        body: {
          error: "upgrade_required",
          featureKey,
          message: `${getFeatureDisplayName(featureKey)} is available on Pro.`,
        },
      },
    };
  }

  // 4. Check/enforce usage limit
  const limit = getLimit(plan, featureKey);

  // Skip usage tracking for non-usage-limited features (like channels_connected)
  if (featureKey === "channels_connected") {
    return {
      ok: true,
      context: {
        user,
        plan,
        usage: null,
      },
    };
  }

  let usage: UsageCheckResult;

  if (increment) {
    usage = await checkAndIncrement({
      userId: user.id,
      featureKey,
      limit,
      amount,
    });
  } else {
    usage = await getUsageInfo(user.id, featureKey, limit);
  }

  if (!usage.allowed) {
    return {
      ok: false,
      error: {
        type: "limit_reached",
        status: 403,
        body: {
          error: "limit_reached",
          featureKey,
          used: usage.used,
          limit: usage.limit,
          remaining: usage.remaining,
          resetAt: usage.resetAt,
          upgrade: plan === "FREE",
        },
      },
    };
  }

  return {
    ok: true,
    context: {
      user,
      plan,
      usage,
    },
  };
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Convert entitlement error to Response
 */
export function entitlementErrorResponse(error: EntitlementError): Response {
  return Response.json(error.body, { status: error.status });
}

/**
 * Create a standard limit_reached error response
 */
export function limitReachedResponse(
  featureKey: FeatureKey,
  usage: UsageCheckResult,
  plan: Plan
): Response {
  return Response.json(
    {
      error: "limit_reached",
      featureKey,
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      resetAt: usage.resetAt,
      upgrade: plan === "FREE",
    },
    { status: 403 }
  );
}

/**
 * Create a standard upgrade_required error response (for locked features)
 */
export function upgradeRequiredResponse(featureKey: FeatureKey): Response {
  return Response.json(
    {
      error: "upgrade_required",
      featureKey,
      message: `${getFeatureDisplayName(featureKey)} is available on Pro.`,
    },
    { status: 403 }
  );
}

// ============================================
// CHANNEL LIMIT HELPERS
// ============================================

/**
 * Check if user can connect another channel
 */
export async function checkChannelLimit(userId: number): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
}> {
  const subscription = await getSubscriptionStatus(userId);
  const plan = getPlanFromSubscription(subscription);
  const limit = getLimit(plan, "channels_connected");

  // Import prisma here to avoid circular deps
  const { prisma } = await import("@/prisma");
  const channelCount = await prisma.channel.count({
    where: { userId },
  });

  return {
    allowed: channelCount < limit,
    current: channelCount,
    limit,
    plan,
  };
}

/**
 * Create channel limit exceeded error response
 */
export function channelLimitResponse(current: number, limit: number, plan: Plan): Response {
  return Response.json(
    {
      error: "channel_limit_reached",
      featureKey: "channels_connected",
      current,
      limit,
      message:
        plan === "FREE"
          ? `Free plan allows ${limit} channel. Upgrade to Pro for more.`
          : `You have reached the maximum of ${limit} channels for your plan.`,
      upgrade: plan === "FREE",
    },
    { status: 403 }
  );
}

// ============================================
// COMBINED HELPER FOR ROUTE HANDLERS
// ============================================

/**
 * Higher-order function to wrap a route handler with entitlement checking
 *
 * Example usage:
 * ```ts
 * export const GET = withEntitlements(
 *   { featureKey: "owned_video_analysis" },
 *   async (req, context) => {
 *     // context.user, context.plan, context.usage are available
 *     return Response.json({ data: "..." });
 *   }
 * );
 * ```
 */
export function withEntitlements<T extends (...args: any[]) => Promise<Response>>(
  options: {
    featureKey: FeatureKey;
    increment?: boolean;
    amount?: number;
  },
  handler: (
    ...args: [...Parameters<T>, EntitlementContext]
  ) => Promise<Response>
): T {
  return (async (...args: Parameters<T>) => {
    const result = await checkEntitlement(options);

    if (!result.ok) {
      return entitlementErrorResponse(result.error);
    }

    return handler(...args, result.context);
  }) as T;
}

