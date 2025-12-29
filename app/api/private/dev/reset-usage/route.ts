/**
 * POST /api/private/dev/reset-usage
 *
 * Reset today's usage counters for the current user.
 * DEV-ONLY: This route only works when NODE_ENV !== "production"
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { resetUserUsage, getAllUsage } from "@/lib/usage";

export async function POST(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get usage before reset (for logging)
    const beforeUsage = await getAllUsage(user.id);

    // Reset all usage for today
    await resetUserUsage(user.id);

    // Get usage after reset
    const afterUsage = await getAllUsage(user.id);

    return Response.json({
      success: true,
      message: "Usage counters reset for today",
      userId: user.id,
      before: beforeUsage,
      after: afterUsage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Reset usage error:", err);
    return Response.json(
      { error: "Failed to reset usage", detail: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/private/dev/reset-usage
 *
 * Get current usage counters for the current user.
 * DEV-ONLY: This route only works when NODE_ENV !== "production"
 */
export async function GET(req: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const usage = await getAllUsage(user.id);

    // Also get limits for context
    const { getSubscriptionStatus } = await import("@/lib/stripe");
    const { getPlanFromSubscription, getLimits, getResetAt } = await import("@/lib/entitlements");
    
    const subscription = await getSubscriptionStatus(user.id);
    const plan = getPlanFromSubscription(subscription);
    const limits = getLimits(plan);
    const resetAt = getResetAt();

    return Response.json({
      userId: user.id,
      plan,
      limits,
      usage,
      resetAt: resetAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get usage error:", err);
    return Response.json(
      { error: "Failed to get usage", detail: message },
      { status: 500 }
    );
  }
}

