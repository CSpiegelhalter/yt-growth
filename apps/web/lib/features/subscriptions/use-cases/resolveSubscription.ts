/**
 * Subscription status resolution — normalizes raw DB/Stripe state into
 * a canonical SubscriptionStatus.
 *
 * The heavy Stripe webhook handling and checkout/portal session creation
 * remain in lib/stripe.ts (orchestration) and lib/adapters/stripe/ (I/O).
 * This use-case owns the pure status-normalization logic.
 */
import "server-only";

import { LIMITS } from "@/lib/shared/product";
import { prisma } from "@/prisma";

import { SubscriptionError } from "../errors";
import type { SubscriptionStatus } from "../types";

type SubscriptionRow = {
  userId: number;
  plan: string;
  status: string;
  channelLimit: number;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  cancelAt: Date | null;
  canceledAt: Date | null;
};

const FREE_STATUS: SubscriptionStatus = {
  status: "inactive",
  plan: "free",
  channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  cancelAt: null,
  canceledAt: null,
  isActive: false,
};

const ACTIVE_DB_STATUSES = new Set(["active", "trialing", "past_due"]);

function computeEffectiveEnd(sub: SubscriptionRow): Date | null {
  if (sub.cancelAt && sub.currentPeriodEnd) {
    return sub.cancelAt.getTime() <= sub.currentPeriodEnd.getTime()
      ? sub.cancelAt
      : sub.currentPeriodEnd;
  }
  return sub.cancelAt ?? sub.currentPeriodEnd;
}

function computeIsActive(sub: SubscriptionRow, effectiveEnd: Date | null): boolean {
  if (sub.plan === "free") {
    return false;
  }
  if (effectiveEnd) {
    return effectiveEnd.getTime() > Date.now();
  }
  return ACTIVE_DB_STATUSES.has(sub.status);
}

function resolveNormalizedStatus(sub: SubscriptionRow, isActive: boolean): string {
  if (isActive) {
    return sub.status;
  }
  const hasCancelSignal = Boolean(sub.cancelAtPeriodEnd) || Boolean(sub.cancelAt) || Boolean(sub.canceledAt);
  return hasCancelSignal ? "canceled" : "inactive";
}

async function normalizeExpiredRow(
  userId: number,
  normalizedStatus: string,
  sub: SubscriptionRow,
  effectiveEnd: Date | null,
  isActive: boolean,
): Promise<void> {
  const isExpired = !isActive && sub.plan !== "free" && effectiveEnd && effectiveEnd.getTime() <= Date.now();
  if (!isExpired) {
    return;
  }

  try {
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: normalizedStatus,
        plan: "free",
        channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      },
    });
  } catch (error) {
    if (error instanceof SubscriptionError) {
      throw error;
    }
    console.warn(`[Subscription] Failed to normalize expired row for user ${userId}:`, error);
  }
}

export async function resolveSubscription(
  userId: number,
): Promise<SubscriptionStatus> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription) {
    return FREE_STATUS;
  }

  const effectiveEnd = computeEffectiveEnd(subscription);
  const isActive = computeIsActive(subscription, effectiveEnd);
  const normalizedStatus = resolveNormalizedStatus(subscription, isActive);
  const normalizedPlan = isActive ? subscription.plan : "free";
  const normalizedChannelLimit = isActive ? subscription.channelLimit : LIMITS.FREE_MAX_CONNECTED_CHANNELS;

  await normalizeExpiredRow(userId, normalizedStatus, subscription, effectiveEnd, isActive);

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
