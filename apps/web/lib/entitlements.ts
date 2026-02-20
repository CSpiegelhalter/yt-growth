import { LIMITS } from "@/lib/product";

// ============================================
// TYPES
// ============================================

export type Plan = "FREE" | "PRO";

export type FeatureKey =
  | "channels_connected"
  | "owned_video_analysis"
  | "competitor_video_analysis"
  | "idea_generate"
  | "channel_sync"
  | "keyword_research"
  | "tag_generate";

type PlanLimits = {
  channels_connected: number;
  owned_video_analysis: number;
  competitor_video_analysis: number;
  idea_generate: number;
  channel_sync: number;
  keyword_research: number; // 0 = locked
  tag_generate: number;
};

// ============================================
// LIMITS CONFIGURATION
// ============================================

const FREE_LIMITS: PlanLimits = {
  channels_connected: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
  owned_video_analysis: 5,
  competitor_video_analysis: 5,
  idea_generate: 10,
  channel_sync: 3,
  keyword_research: 5, // Free tier: 5 keyword research runs per day
  tag_generate: 5,
};

const PRO_LIMITS: PlanLimits = {
  channels_connected: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
  owned_video_analysis: 100,
  competitor_video_analysis: 100,
  idea_generate: 200,
  channel_sync: 50,
  keyword_research: 100, // Pro tier: 100 keyword research runs per day
  tag_generate: 200,
};

// Features that are completely locked (not just usage-limited)
const LOCKED_FEATURES: Record<Plan, FeatureKey[]> = {
  FREE: [], // keyword_research now has usage limits instead of being locked
  PRO: [],
};

/**
 * Alternative: determine plan from raw subscription object (server-side)
 */
export function getPlanFromSubscription(
  subscription: {
    isActive: boolean;
    plan: string;
    currentPeriodEnd: Date | string | null;
  } | null
): Plan {
  if (!subscription) return "FREE";
  if (!subscription.isActive) return "FREE";
  if (subscription.plan === "free") return "FREE";

  if (subscription.currentPeriodEnd) {
    const periodEnd =
      typeof subscription.currentPeriodEnd === "string"
        ? new Date(subscription.currentPeriodEnd)
        : subscription.currentPeriodEnd;
    if (periodEnd.getTime() <= Date.now()) return "FREE";
  }

  return "PRO";
}

// ============================================
// LIMITS & FEATURE ACCESS
// ============================================

/**
 * Get all limits for a plan
 */
export function getLimits(plan: Plan): PlanLimits {
  return plan === "PRO" ? PRO_LIMITS : FREE_LIMITS;
}

/**
 * Get limit for a specific feature
 */
export function getLimit(plan: Plan, feature: FeatureKey): number {
  const limits = getLimits(plan);
  return limits[feature];
}
/**
 * Check if a feature is completely locked (not usage-limited, just no access)
 */
export function featureLocked(plan: Plan, feature: FeatureKey): boolean {
  return LOCKED_FEATURES[plan].includes(feature);
}

// ============================================
// RESET TIMING
// ============================================

/**
 * Get the next reset time (midnight in America/Chicago timezone)
 */
export function getResetAt(): Date {
  const now = new Date();

  // Convert to Chicago time
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

  // Create midnight tomorrow in Chicago
  const tomorrowChicago = new Date(
    Date.UTC(chicagoYear, chicagoMonth, chicagoDay + 1, 6, 0, 0) // 6 AM UTC = midnight Chicago (CST = UTC-6)
  );

  // Adjust for DST if needed (Chicago is UTC-5 during DST, UTC-6 during standard)
  // For simplicity, we'll use a fixed 6 AM UTC which is close enough
  return tomorrowChicago;
}

/**
 * Get today's date key for usage tracking (YYYY-MM-DD in Chicago timezone)
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const chicagoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return chicagoFormatter.format(now); // Returns YYYY-MM-DD
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get human-readable feature name
 */
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
