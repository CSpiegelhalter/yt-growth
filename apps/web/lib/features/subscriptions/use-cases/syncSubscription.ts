import "server-only";

import { prisma } from "@/prisma";
import { stripeRequest, type StripeSubscription } from "@/lib/stripe";
import { LIMITS } from "@/lib/shared/product";
import { SubscriptionError } from "../errors";

type SyncSubscriptionInput = {
  userId: number;
};

type SyncSubscriptionResult = {
  synced: true;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  message?: string;
};

export async function syncSubscription(
  input: SyncSubscriptionInput,
): Promise<SyncSubscriptionResult> {
  const { userId } = input;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new SubscriptionError(
      "NOT_FOUND",
      "No Stripe customer found",
    );
  }

  let customerSubs: { data: StripeSubscription[] };
  try {
    customerSubs = await stripeRequest<{ data: StripeSubscription[] }>(
      `/subscriptions?customer=${subscription.stripeCustomerId}&status=all&limit=1`,
    );
  } catch (err) {
    throw new SubscriptionError(
      "EXTERNAL_FAILURE",
      "Stripe sync failed",
      err,
    );
  }

  if (!customerSubs.data || customerSubs.data.length === 0) {
    return {
      synced: true,
      message: "No active subscription found",
      plan: "free",
      status: "inactive",
    };
  }

  const stripeSub = customerSubs.data[0];
  const isActive = ["active", "trialing"].includes(stripeSub.status);
  const plan = isActive ? "pro" : "free";
  const periodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000)
    : null;

  await prisma.subscription.update({
    where: { userId },
    data: {
      stripeSubscriptionId: stripeSub.id,
      status: isActive ? "active" : "inactive",
      plan,
      channelLimit: isActive
        ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
        : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
    },
  });

  return {
    synced: true,
    plan,
    status: isActive ? "active" : "inactive",
    currentPeriodEnd: periodEnd?.toISOString(),
  };
}
