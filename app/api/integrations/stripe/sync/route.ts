/**
 * POST /api/integrations/stripe/sync
 *
 * Manually sync subscription status from Stripe.
 * Used when webhook might not have fired (e.g., localhost testing).
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/prisma";
import { stripeRequest, StripeSubscription } from "@/lib/stripe";
import { LIMITS } from "@/lib/product";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current subscription record
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        status: true,
        plan: true,
      },
    });

    if (!subscription?.stripeCustomerId) {
      return Response.json(
        { error: "No Stripe customer found", synced: false },
        { status: 404 }
      );
    }

    console.log(`[Stripe Sync] Syncing subscription for user ${user.id}`);

    // Fetch customer's subscriptions from Stripe
    const customerSubs = await stripeRequest<{ data: StripeSubscription[] }>(
      `/subscriptions?customer=${subscription.stripeCustomerId}&status=all&limit=1`
    );

    if (!customerSubs.data || customerSubs.data.length === 0) {
      console.log(`[Stripe Sync] No subscriptions found for customer`);
      return Response.json({
        synced: true,
        message: "No active subscription found",
        plan: "free",
      });
    }

    const stripeSub = customerSubs.data[0];
    console.log(`[Stripe Sync] Found subscription:`, {
      id: stripeSub.id,
      status: stripeSub.status,
      current_period_end: stripeSub.current_period_end,
    });

    // Determine plan and status
    const isActive = ["active", "trialing"].includes(stripeSub.status);
    const plan = isActive ? "pro" : "free";
    const periodEnd = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000)
      : null;

    // Update database
    await prisma.subscription.update({
      where: { userId: user.id },
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

    console.log(`[Stripe Sync] Updated subscription: plan=${plan}, status=${isActive ? "active" : "inactive"}`);

    return Response.json({
      synced: true,
      plan,
      status: isActive ? "active" : "inactive",
      currentPeriodEnd: periodEnd?.toISOString(),
    });
  } catch (err: unknown) {
    console.error("[Stripe Sync] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Sync failed", synced: false },
      { status: 500 }
    );
  }
}

