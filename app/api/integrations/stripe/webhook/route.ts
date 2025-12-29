/**
 * POST /api/integrations/stripe/webhook
 *
 * Handle Stripe webhook events.
 *
 * Auth: Stripe signature verification
 */
import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    const result = await handleStripeWebhook(payload, signature);

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", err);
    return Response.json(
      { error: "Webhook handling failed", detail: message },
      { status: 400 }
    );
  }
}
