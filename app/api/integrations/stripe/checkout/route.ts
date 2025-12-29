/**
 * GET/POST /api/integrations/stripe/checkout
 *
 * Create a Stripe Checkout session for subscription.
 * GET: Redirects directly to Stripe checkout
 * POST: Returns JSON with checkout URL
 *
 * Auth: Required
 * Rate limit: 3 per minute per user
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { createCheckoutSession } from "@/lib/stripe";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

async function handleCheckout(returnJson: boolean) {
  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    if (returnJson) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login for GET requests
    return NextResponse.redirect(
      new URL(
        "/auth/login?redirect=/api/integrations/stripe/checkout",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }

  // Rate limit check
  const rateKey = rateLimitKey("checkout", user.id);
  const rateResult = checkRateLimit(rateKey, RATE_LIMITS.checkout);
  if (!rateResult.success) {
    if (returnJson) {
      return Response.json(
        {
          error: "Too many checkout attempts. Please try again later.",
          resetAt: new Date(rateResult.resetAt),
        },
        { status: 429 }
      );
    }
    return NextResponse.redirect(
      new URL(
        "/dashboard?error=rate_limit",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }

  // Create checkout session
  const { url } = await createCheckoutSession(user.id, user.email);

  if (returnJson) {
    return Response.json({ url });
  }

  // Redirect to Stripe checkout
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  try {
    return await handleCheckout(false);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", err);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=checkout_failed&message=${encodeURIComponent(
          message
        )}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleCheckout(true);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", err);
    return Response.json(
      { error: "Failed to create checkout session", detail: message },
      { status: 500 }
    );
  }
}
