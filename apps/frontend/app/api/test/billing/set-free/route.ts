/**
 * POST /api/test/billing/set-free
 *
 * Test-only route to set user's subscription to FREE (inactive).
 * Only available when APP_TEST_MODE=1.
 *
 * This mimics what happens when a subscription expires or is downgraded.
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

    logTestAction("billing/set-free", { userId: user.id });

    // Set subscription to FREE/inactive state
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: "inactive",
        plan: "free",
        channelLimit: 1, // FREE limit
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        cancelAt: null,
        canceledAt: null,
      },
      create: {
        userId: user.id,
        status: "inactive",
        plan: "free",
        channelLimit: 1,
        stripeCustomerId: `cus_test_${user.id}`,
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
    console.error("[TEST] billing/set-free error:", err);
    return Response.json(
      { error: "Failed to set FREE", detail: message },
      { status: 500 }
    );
  }
}

