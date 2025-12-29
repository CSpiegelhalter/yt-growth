/**
 * GET /api/me
 *
 * Get current user profile with subscription status and usage info.
 *
 * Auth: Required
 */
import { getCurrentUserWithSubscription } from "@/lib/user";
import { getSubscriptionStatus } from "@/lib/stripe";
import {
  getPlanFromSubscription,
  getLimits,
  getResetAt,
  type Plan,
} from "@/lib/entitlements";
import { getAllUsage } from "@/lib/usage";

export async function GET() {
  try {
    const user = await getCurrentUserWithSubscription();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    console.error("Get user error:", err);
    return Response.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
