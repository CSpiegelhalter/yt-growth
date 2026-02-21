/**
 * Check entitlements for a feature access.
 *
 * Determines the user's plan, checks feature locks, and optionally
 * enforces / peeks at usage limits.
 *
 * No "server-only" guard here — all functions are pure (I/O is via
 * callbacks), so unit tests can import them freely.
 */
import type {
  Plan,
  FeatureKey,
  PlanLimits,
  EntitlementCheckResult,
  UsageCheckResult,
  ChannelLimitResult,
} from "../types";
import { FREE_LIMITS, PRO_LIMITS, LOCKED_FEATURES } from "../types";

// ── Pure helpers (no I/O) ────────────────────────────────────

export function getPlanFromSubscription(
  subscription: {
    isActive: boolean;
    plan: string;
    currentPeriodEnd: Date | string | null;
  } | null,
): Plan {
  if (!subscription) {return "FREE";}
  if (!subscription.isActive) {return "FREE";}
  if (subscription.plan === "free") {return "FREE";}

  if (subscription.currentPeriodEnd) {
    const periodEnd =
      typeof subscription.currentPeriodEnd === "string"
        ? new Date(subscription.currentPeriodEnd)
        : subscription.currentPeriodEnd;
    if (periodEnd.getTime() <= Date.now()) {return "FREE";}
  }

  return "PRO";
}

export function getLimits(plan: Plan): PlanLimits {
  return plan === "PRO" ? PRO_LIMITS : FREE_LIMITS;
}

export function getLimit(plan: Plan, feature: FeatureKey): number {
  return getLimits(plan)[feature];
}

export function featureLocked(plan: Plan, feature: FeatureKey): boolean {
  return LOCKED_FEATURES[plan].includes(feature);
}

export function getFeatureDisplayName(feature: FeatureKey): string {
  const names: Record<FeatureKey, string> = {
    channels_connected: "Connected Channels",
    owned_video_analysis: "Video Analysis",
    competitor_video_analysis: "Competitor Analysis",
    idea_generate: "Idea Generation",
    channel_sync: "Channel Sync",
    keyword_research: "Keyword Research",
    tag_generate: "Tag Generation",
  };
  return names[feature];
}

// ── Reset timing ─────────────────────────────────────────────

export function getResetAt(): Date {
  const now = new Date();
  const chicagoFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = chicagoFormatter.formatToParts(now);
  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const chicagoYear = parseInt(getPart("year"), 10);
  const chicagoMonth = parseInt(getPart("month"), 10) - 1;
  const chicagoDay = parseInt(getPart("day"), 10);

  const tomorrowChicago = new Date(
    Date.UTC(chicagoYear, chicagoMonth, chicagoDay + 1, 6, 0, 0),
  );

  return tomorrowChicago;
}

export function getTodayDateKey(): string {
  const now = new Date();
  const chicagoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return chicagoFormatter.format(now);
}

// ── Orchestrated entitlement check ──────────────────────────

/**
 * Full entitlement check: resolves plan, verifies feature access, and
 * optionally checks/increments usage.
 *
 * Callers must supply the user lookup and subscription-status callbacks
 * so this function stays free of direct adapter imports.
 */
export async function checkEntitlement(options: {
  featureKey: FeatureKey;
  increment?: boolean;
  amount?: number;
  getUser: () => Promise<{ id: number } | null>;
  getSubscriptionStatus: (userId: number) => Promise<{
    isActive: boolean;
    plan: string;
    currentPeriodEnd: Date | string | null;
  }>;
  checkAndIncrement: (opts: {
    userId: number;
    featureKey: FeatureKey;
    limit: number;
    amount?: number;
  }) => Promise<UsageCheckResult>;
  getUsageInfo: (
    userId: number,
    featureKey: FeatureKey,
    limit: number,
  ) => Promise<UsageCheckResult>;
}): Promise<EntitlementCheckResult> {
  const {
    featureKey,
    increment = true,
    amount = 1,
    getUser,
    getSubscriptionStatus,
    checkAndIncrement,
    getUsageInfo,
  } = options;

  const user = await getUser();
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

  const subscription = await getSubscriptionStatus(user.id);
  const plan = getPlanFromSubscription(subscription);

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

  const limit = getLimit(plan, featureKey);

  if (featureKey === "channels_connected") {
    return {
      ok: true,
      context: { userId: user.id, plan, usage: null },
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
    context: { userId: user.id, plan, usage },
  };
}

/**
 * Check if a user can connect another channel.
 */
export async function checkChannelLimit(options: {
  userId: number;
  getSubscriptionStatus: (userId: number) => Promise<{
    isActive: boolean;
    plan: string;
    currentPeriodEnd: Date | string | null;
  }>;
  getChannelCount: (userId: number) => Promise<number>;
}): Promise<ChannelLimitResult> {
  const { userId, getSubscriptionStatus, getChannelCount } = options;
  const subscription = await getSubscriptionStatus(userId);
  const plan = getPlanFromSubscription(subscription);
  const limit = getLimit(plan, "channels_connected");
  const current = await getChannelCount(userId);

  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  };
}
