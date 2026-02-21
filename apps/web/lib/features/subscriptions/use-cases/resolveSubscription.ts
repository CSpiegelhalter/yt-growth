/**
 * Subscription status resolution — normalizes raw DB/Stripe state into
 * a canonical SubscriptionStatus.
 *
 * The heavy Stripe webhook handling and checkout/portal session creation
 * remain in lib/stripe.ts (orchestration) and lib/adapters/stripe/ (I/O).
 * This use-case owns the pure status-normalization logic.
 */
import "server-only";

import { prisma } from "@/prisma";
import { LIMITS } from "@/lib/shared/product";
import { SubscriptionError } from "../errors";
import type { SubscriptionStatus } from "../types";

export async function resolveSubscription(
  userId: number,
): Promise<SubscriptionStatus> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      status: "inactive",
      plan: "free",
      channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: null,
      isActive: false,
    };
  }

  const now = Date.now();
  const effectiveEnd =
    subscription.cancelAt && subscription.currentPeriodEnd
      ? subscription.cancelAt.getTime() <=
        subscription.currentPeriodEnd.getTime()
        ? subscription.cancelAt
        : subscription.currentPeriodEnd
      : subscription.cancelAt ?? subscription.currentPeriodEnd;

  const isActive =
    subscription.plan !== "free" &&
    (effectiveEnd
      ? effectiveEnd.getTime() > now
      : subscription.status === "active" ||
        subscription.status === "trialing" ||
        subscription.status === "past_due");

  const hasCancelSignal =
    Boolean(subscription.cancelAtPeriodEnd) ||
    Boolean(subscription.cancelAt) ||
    Boolean(subscription.canceledAt);

  const normalizedStatus = isActive
    ? subscription.status
    : hasCancelSignal
      ? "canceled"
      : "inactive";
  const normalizedPlan = isActive ? subscription.plan : "free";
  const normalizedChannelLimit = isActive
    ? subscription.channelLimit
    : LIMITS.FREE_MAX_CONNECTED_CHANNELS;

  if (
    !isActive &&
    subscription.plan !== "free" &&
    effectiveEnd &&
    effectiveEnd.getTime() <= now
  ) {
    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: normalizedStatus,
          plan: "free",
          channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
        },
      });
    } catch (err) {
      if (err instanceof SubscriptionError) throw err;
      console.warn(
        `[Subscription] Failed to normalize expired row for user ${userId}:`,
        err,
      );
    }
  }

  return {
    status: normalizedStatus,
    plan: normalizedPlan,
    channelLimit: normalizedChannelLimit,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    cancelAt: subscription.cancelAt,
    canceledAt: subscription.canceledAt,
    isActive,
  };
}
