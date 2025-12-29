/**
 * POST /api/test/billing/set-pro
 *
 * Test-only route to set user's subscription to PRO (active).
 * Only available when APP_TEST_MODE=1.
 *
 * This mimics what the Stripe webhook handler does when a subscription is activated.
 *
 * Returns:
 * {
 *   "success": true,
 *   "subscription": { ... }
 * }
 */
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";

export async function POST() {
  // Guard: only available in test mode
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    logTestAction("billing/set-pro", { userId: user.id });

    // Set subscription to PRO active state
    // This mirrors what the Stripe webhook handler does
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: "active",
        plan: "pro",
        channelLimit: 3, // PRO limit
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelAt: null,
        canceledAt: null,
        stripeCustomerId: `cus_test_${user.id}`,
        stripeSubscriptionId: `sub_test_${user.id}_${Date.now()}`,
      },
      create: {
        userId: user.id,
        status: "active",
        plan: "pro",
        channelLimit: 3,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        stripeCustomerId: `cus_test_${user.id}`,
        stripeSubscriptionId: `sub_test_${user.id}_${Date.now()}`,
      },
    });

    return Response.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        channelLimit: subscription.channelLimit,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] billing/set-pro error:", err);
    return Response.json(
      { error: "Failed to set PRO", detail: message },
      { status: 500 }
    );
  }
}

