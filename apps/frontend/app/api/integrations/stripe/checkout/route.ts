/**
 * POST /api/integrations/stripe/checkout
 *
 * Create a Stripe Checkout session for subscription.
 *
 * Auth: Required
 * Rate limit: 3 per minute per user
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { createCheckoutSession } from "@/lib/stripe";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const rateKey = rateLimitKey("checkout", user.id);
    const rateResult = checkRateLimit(rateKey, RATE_LIMITS.checkout);
    if (!rateResult.success) {
      return Response.json(
        {
          error: "Too many checkout attempts. Please try again later.",
          resetAt: new Date(rateResult.resetAt),
        },
        { status: 429 }
      );
    }

    // Create checkout session
    const { url } = await createCheckoutSession(user.id, user.email);

    return Response.json({ url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return Response.json(
      { error: "Failed to create checkout session", detail: err.message },
      { status: 500 }
    );
  }
}

