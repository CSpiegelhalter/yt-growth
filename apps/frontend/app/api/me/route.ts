/**
 * GET /api/me
 *
 * Get current user profile with subscription status.
 *
 * Auth: Required
 */
import { getCurrentUserWithSubscription } from "@/lib/user";
import { getSubscriptionStatus } from "@/lib/stripe";

export async function GET() {
  try {
    const user = await getCurrentUserWithSubscription();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get detailed subscription status
    const subscription = await getSubscriptionStatus(user.id);

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: subscription.plan,
      status: subscription.status,
      channel_limit: subscription.channelLimit,
      subscription: {
        isActive: subscription.isActive,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
      },
    };

    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err: any) {
    console.error("Get user error:", err);
    return Response.json(
      { error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
