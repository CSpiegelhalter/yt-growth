/**
 * GET /api/dev/sync-subscription
 *
 * DEV ONLY: Manually sync subscription status from Stripe.
 * Use this when webhooks aren't working locally.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/prisma";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the subscription record
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return Response.json({
        error: "No Stripe customer found. Please go through checkout first.",
        action: "Visit /api/integrations/stripe/checkout to subscribe.",
      }, { status: 400 });
    }

    // Fetch subscriptions from Stripe for this customer
    const response = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${subscription.stripeCustomerId}&status=active&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Stripe API error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const stripeSub = data.data[0];
      
      // Update the subscription in the database
      const updated = await prisma.subscription.update({
        where: { userId: user.id },
        data: {
          stripeSubscriptionId: stripeSub.id,
          status: "active",
          plan: "pro",
          channelLimit: 5,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      });

      return Response.json({
        success: true,
        message: "Subscription synced successfully!",
        subscription: {
          status: updated.status,
          plan: updated.plan,
          currentPeriodEnd: updated.currentPeriodEnd,
        },
        nextStep: "Refresh your dashboard - you should now see Pro features.",
      });
    } else {
      return Response.json({
        success: false,
        message: "No active subscription found in Stripe for this customer.",
        customerId: subscription.stripeCustomerId,
        suggestion: "Make sure you completed the Stripe checkout. Check your Stripe dashboard.",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Sync subscription error:", err);
    return Response.json(
      { error: "Failed to sync subscription", detail: message },
      { status: 500 }
    );
  }
}

