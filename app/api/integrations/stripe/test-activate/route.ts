/**
 * GET /api/integrations/stripe/test-activate
 *
 * TEST_MODE only: Activate subscription without going through Stripe.
 * This endpoint only works when TEST_MODE=1 is set.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";

export async function GET(req: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== "1") {
    return Response.json(
      { error: "This endpoint is only available in test mode" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const userId = parseInt(url.searchParams.get("userId") ?? "", 10);

  if (!userId || !Number.isFinite(userId)) {
    return Response.json({ error: "Invalid userId" }, { status: 400 });
  }

  // Activate subscription
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: "active",
      plan: "pro",
      channelLimit: 5,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeCustomerId: `test_customer_${userId}`,
      stripeSubscriptionId: `test_sub_${userId}`,
    },
    create: {
      userId,
      status: "active",
      plan: "pro",
      channelLimit: 5,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: `test_customer_${userId}`,
      stripeSubscriptionId: `test_sub_${userId}`,
    },
  });

  // Redirect to dashboard
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/dashboard?checkout=success", appUrl));
}

