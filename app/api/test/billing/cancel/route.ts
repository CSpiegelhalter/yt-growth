/**
 * POST /api/test/billing/cancel
 * 
 * Test-only: Cancel the user's Stripe subscription via API.
 * This triggers real Stripe webhooks (subscription.updated, subscription.deleted).
 * 
 * Only works when APP_TEST_MODE=1
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import { createApiRoute } from "@/lib/api/route";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

async function POSTHandler(req: NextRequest) {
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { stripeSubscriptionId: true, stripeCustomerId: true, status: true },
    });

    if (!subscription?.stripeSubscriptionId) {
      return Response.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    if (!STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    // Cancel the subscription at period end via Stripe API
    // User keeps access until the end of their paid period
    // This will trigger a customer.subscription.updated webhook
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription.stripeSubscriptionId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "cancel_at_period_end=true",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[test/billing/cancel] Stripe error:", error);
      return Response.json(
        { error: "Failed to cancel subscription", detail: error },
        { status: 500 }
      );
    }

    const canceledSub = await response.json();

    logTestAction("billing/cancel", {
      userId: user.id,
      subscriptionId: subscription.stripeSubscriptionId,
      status: canceledSub.status,
      cancel_at_period_end: canceledSub.cancel_at_period_end,
      current_period_end: canceledSub.current_period_end,
    });

    return Response.json({
      success: true,
      message: "Subscription scheduled to cancel at period end",
      subscriptionId: subscription.stripeSubscriptionId,
      status: canceledSub.status,
      cancelAtPeriodEnd: canceledSub.cancel_at_period_end,
      currentPeriodEnd: canceledSub.current_period_end,
    });
  } catch (err: unknown) {
    console.error("[test/billing/cancel] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/test/billing/cancel" },
  async (req) => POSTHandler(req)
);

