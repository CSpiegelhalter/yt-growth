/**
 * POST /api/integrations/stripe/sync
 *
 * Manually sync subscription status from Stripe.
 * Used when webhook might not have fired (e.g., localhost testing).
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/prisma";
import { stripeRequest, StripeSubscription } from "@/lib/stripe";
import { LIMITS } from "@/lib/product";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/integrations/stripe/sync" },
  withAuth({ mode: "required" }, async (_req: NextRequest, _ctx, api) => {
    const user = (api as ApiAuthContext).user!;
    // Get current subscription record
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: {
        stripeCustomerId: true,
      },
    });

    if (!subscription?.stripeCustomerId) {
      throw new ApiError({
        code: "NOT_FOUND",
        status: 404,
        message: "No Stripe customer found",
      });
    }

    // Fetch customer's subscriptions from Stripe
    let customerSubs: { data: StripeSubscription[] };
    try {
      customerSubs = await stripeRequest<{ data: StripeSubscription[] }>(
        `/subscriptions?customer=${subscription.stripeCustomerId}&status=all&limit=1`
      );
    } catch (err) {
      throw new ApiError({
        code: "INTEGRATION_ERROR",
        status: 502,
        message: "Stripe sync failed",
        details: { provider: "stripe" },
      });
    }

    if (!customerSubs.data || customerSubs.data.length === 0) {
      return jsonOk(
        {
        synced: true,
        message: "No active subscription found",
        plan: "free",
        },
        { requestId: api.requestId }
      );
    }

    const stripeSub = customerSubs.data[0];

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

    return jsonOk(
      {
        synced: true,
        plan,
        status: isActive ? "active" : "inactive",
        currentPeriodEnd: periodEnd?.toISOString(),
      },
      { requestId: api.requestId }
    );
  })
);

