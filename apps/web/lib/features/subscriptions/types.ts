/**
 * Domain types for the subscriptions / entitlements feature.
 *
 * Plan configuration (tiers, limits), entitlement check DTOs,
 * and usage-tracking DTOs all live here.
 */

import { LIMITS } from "@/lib/shared/product";

// ── Plan & Feature Keys ─────────────────────────────────────

export type Plan = "FREE" | "PRO";

export type FeatureKey =
  | "channels_connected"
  | "owned_video_analysis"
  | "competitor_video_analysis"
  | "idea_generate"
  | "channel_sync"
  | "keyword_research"
  | "tag_generate";

// ── Plan Limits Configuration ───────────────────────────────

export type PlanLimits = {
  [K in FeatureKey]: number;
};

export const FREE_LIMITS: PlanLimits = {
  channels_connected: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
  owned_video_analysis: 5,
  competitor_video_analysis: 5,
  idea_generate: 10,
  channel_sync: 3,
  keyword_research: 5,
  tag_generate: 5,
};

export const PRO_LIMITS: PlanLimits = {
  channels_connected: LIMITS.PRO_MAX_CONNECTED_CHANNELS,
  owned_video_analysis: 100,
  competitor_video_analysis: 100,
  idea_generate: 200,
  channel_sync: 50,
  keyword_research: 100,
  tag_generate: 200,
};

/** Features completely locked on a given plan (not just usage-limited). */
export const LOCKED_FEATURES: Record<Plan, FeatureKey[]> = {
  FREE: [],
  PRO: [],
};

// ── Usage DTOs ──────────────────────────────────────────────

export type UsageCheckResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
};

// ── Entitlement DTOs ────────────────────────────────────────

type EntitlementContext = {
  userId: number;
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

// ── Subscription Status ─────────────────────────────────────

export type SubscriptionStatus = {
  status: string;
  plan: string;
  channelLimit: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  canceledAt: Date | null;
  isActive: boolean;
};

// ── Channel Limit Check ─────────────────────────────────────

export type ChannelLimitResult = {
  allowed: boolean;
  current: number;
  limit: number;
  plan: Plan;
};
