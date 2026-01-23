/**
 * GET /api/me
 *
 * Get current user profile with subscription status and usage info.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import type { ApiAuthContext } from "@/lib/api/withAuth";
import { getSubscriptionStatus } from "@/lib/stripe";
import {
  getPlanFromSubscription,
  getLimits,
  getResetAt,
  type Plan,
} from "@/lib/entitlements";
import { getAllUsage } from "@/lib/usage";

export const GET = createApiRoute(
  { route: "/api/me" },
  withAuth({ mode: "required" }, async (_req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;

    // Get detailed subscription status
    const subscription = await getSubscriptionStatus(user.id);

    // Compute plan and get limits
    const plan = getPlanFromSubscription(subscription) as Plan;
    const limits = getLimits(plan);
    const resetAt = getResetAt();

    // Get today's usage
    const usageRecords = await getAllUsage(user.id);
    const usageMap: Record<string, number> = {};
    for (const record of usageRecords) {
      usageMap[record.featureKey] = record.count;
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: subscription.plan,
      status: subscription.status,
      channel_limit: subscription.channelLimit,
      subscription: {
        isActive: subscription.isActive,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
      },
      // Add usage information for UI display
      usage: {
        owned_video_analysis: {
          used: usageMap["owned_video_analysis"] ?? 0,
          limit: limits.owned_video_analysis,
        },
        competitor_video_analysis: {
          used: usageMap["competitor_video_analysis"] ?? 0,
          limit: limits.competitor_video_analysis,
        },
        idea_generate: {
          used: usageMap["idea_generate"] ?? 0,
          limit: limits.idea_generate,
        },
        channel_sync: {
          used: usageMap["channel_sync"] ?? 0,
          limit: limits.channel_sync,
        },
      },
      resetAt: resetAt.toISOString(),
    };

    return jsonOk(payload, {
      headers: { "cache-control": "no-store" },
      requestId: api.requestId,
    });
  })
);

// Backwards-compatible signature guard (Next sometimes calls with no ctx)
export const runtime = "nodejs";

