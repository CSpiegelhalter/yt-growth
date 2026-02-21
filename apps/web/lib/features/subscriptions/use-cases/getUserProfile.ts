import { resolveSubscription } from "./resolveSubscription";
import { getPlanFromSubscription, getLimits, getResetAt } from "./checkEntitlement";
import { getAllUsage } from "./trackUsage";
import type { Plan } from "../types";

type GetUserProfileInput = {
  userId: number;
  email: string | null;
  name: string | null;
};

export async function getUserProfile(input: GetUserProfileInput) {
  const { userId, email, name } = input;

  const subscription = await resolveSubscription(userId);

  const plan = getPlanFromSubscription(subscription) as Plan;
  const limits = getLimits(plan);
  const resetAt = getResetAt();

  const usageRecords = await getAllUsage(userId);
  const usageMap: Record<string, number> = {};
  for (const record of usageRecords) {
    usageMap[record.featureKey] = record.count;
  }

  return {
    id: userId,
    email,
    name,
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
}
