/**
 * POST /api/test/billing/set-canceled
 *
 * Test-only route to set user's subscription to canceled state.
 * Only available when APP_TEST_MODE=1.
 *
 * Query params:
 * - endsAt: ISO date string when the subscription ends (optional)
 *           If not provided or in the past, subscription becomes inactive immediately.
 *           If in the future, subscription remains active until that date.
 *
 * Examples:
 * - POST /api/test/billing/set-canceled?endsAt=2025-12-31T23:59:59Z (future - still active)
 * - POST /api/test/billing/set-canceled?endsAt=2024-01-01T00:00:00Z (past - inactive)
 * - POST /api/test/billing/set-canceled (no date - inactive immediately)
 *
 * Returns:
 * {
 *   "success": true,
 *   "subscription": { ... },
 *   "isActive": boolean
 * }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { getCurrentUser } from "@/lib/user";
import { requireTestMode, logTestAction } from "@/lib/test-mode";
import { LIMITS } from "@/lib/product";
import { createApiRoute } from "@/lib/api/route";

async function POSTHandler(req: NextRequest) {
  // Guard: only available in test mode
  const guardResponse = requireTestMode();
  if (guardResponse) return guardResponse;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse endsAt from query string
    const url = new URL(req.url);
    const endsAtParam = url.searchParams.get("endsAt");
    
    let periodEnd: Date | null = null;
    if (endsAtParam) {
      periodEnd = new Date(endsAtParam);
      if (isNaN(periodEnd.getTime())) {
        return Response.json(
          { error: "Invalid endsAt date format. Use ISO 8601." },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const isStillActive = periodEnd && periodEnd.getTime() > now.getTime();

    logTestAction("billing/set-canceled", { 
      userId: user.id, 
      endsAt: periodEnd?.toISOString(),
      isStillActive 
    });

    // Set subscription to canceled state
    // If periodEnd is in the future, user keeps access until then
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: isStillActive ? "active" : "canceled",
        plan: isStillActive ? "pro" : "free",
        channelLimit: isStillActive
          ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
          : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        cancelAt: periodEnd,
        canceledAt: now,
      },
      create: {
        userId: user.id,
        status: isStillActive ? "active" : "canceled",
        plan: isStillActive ? "pro" : "free",
        channelLimit: isStillActive
          ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
          : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: true,
        cancelAt: periodEnd,
        canceledAt: now,
        stripeCustomerId: `cus_test_${user.id}`,
        stripeSubscriptionId: `sub_test_${user.id}_canceled`,
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
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
      },
      isActive: isStillActive,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[TEST] billing/set-canceled error:", err);
    return Response.json(
      { error: "Failed to set canceled", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/test/billing/set-canceled" },
  async (req) => POSTHandler(req)
);

